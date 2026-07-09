import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

/**
 * S3-compatible object storage for public assets (technician avatars).
 * Dev: MinIO container (bucket auto-created with public-read policy).
 * Prod: GCS bucket via S3 interoperability (HMAC keys) — bucket is provisioned
 * out-of-band, see docs/GCP_DEPLOYMENT_GUIDE.md.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  private readonly endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
  private readonly bucket = process.env.S3_BUCKET_AVATARS ?? 'tscrm-avatars';
  // Base URL customers/browsers use to fetch objects (differs from the API
  // endpoint on GCS: https://storage.googleapis.com/<bucket>).
  private readonly publicBaseUrl =
    process.env.S3_PUBLIC_BASE_URL ?? `${process.env.S3_ENDPOINT ?? 'http://localhost:9000'}/${process.env.S3_BUCKET_AVATARS ?? 'tscrm-avatars'}`;

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async onModuleInit() {
    const accessKey = process.env.S3_ACCESS_KEY ?? 'minioadmin';
    const secretKey = process.env.S3_SECRET_KEY ?? 'minioadmin';

    this.client = new S3Client({
      endpoint: this.endpoint,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      // MinIO requires path-style; GCS interop works with it too.
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    });

    // Auto-provision only in dev/MinIO. GCS buckets are created out-of-band.
    if (process.env.S3_AUTO_CREATE_BUCKET !== 'false' && !this.endpoint.includes('googleapis.com')) {
      await this.ensureBucket();
    }
  }

  private async ensureBucket() {
    try {
      await this.client!.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client!.send(new CreateBucketCommand({ Bucket: this.bucket }));
        await this.client!.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucket,
            Policy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${this.bucket}/*`],
                },
              ],
            }),
          }),
        );
        this.logger.log(`Created public-read bucket "${this.bucket}" at ${this.endpoint}`);
      } catch (err) {
        // Storage being down must not stop the CRM service from booting —
        // uploads will 503 until it's back.
        this.logger.warn(`Object storage unavailable (${(err as Error).message}) — avatar uploads disabled until it recovers`);
      }
    }
  }

  /** Upload a public object and return its public URL. */
  async putPublicObject(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!this.client) throw new ServiceUnavailableException('Object storage is not configured');
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: 'public, max-age=86400',
        }),
      );
    } catch (err) {
      this.logger.error(`Upload failed for ${key}: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Photo storage is temporarily unavailable — try again shortly');
    }
    return `${this.publicBaseUrl}/${key}`;
  }

  /** Best-effort delete (replacing/removing an avatar). Never throws. */
  async deleteObject(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.warn(`Delete failed for ${key}: ${(err as Error).message}`);
    }
  }

  /** Extract the object key from a public URL produced by putPublicObject. */
  keyFromUrl(url: string): string | null {
    const prefix = `${this.publicBaseUrl}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }
}
