import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PostDto {
  type?: string;
  title?: string;
  body?: string;
  videoUrl?: string;
  heroImageUrl?: string;
  isPinned?: boolean;
  isPublished?: boolean;
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Trims stray whitespace pasted from address bars — a leading/trailing
   * space is invisible to the admin but can break the image/video URL match. */
  private static clean(dto: PostDto): PostDto {
    return {
      ...dto,
      title: dto.title !== undefined ? dto.title.trim() : dto.title,
      videoUrl: dto.videoUrl !== undefined ? dto.videoUrl.trim() || undefined : dto.videoUrl,
      heroImageUrl: dto.heroImageUrl !== undefined ? dto.heroImageUrl.trim() || undefined : dto.heroImageUrl,
    };
  }

  /** Published TIP/VIDEO/OFFER posts — what the portal reads. */
  listPublished(companyId: string, type?: string) {
    return this.prisma.contractorPost.findMany({
      where: {
        companyId,
        isPublished: true,
        ...(type ? { type } : {}),
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  /** Newest published TIP or VIDEO — for the dashboard card. */
  latestTip(companyId: string) {
    return this.prisma.contractorPost.findFirst({
      where: { companyId, isPublished: true, type: { in: ['TIP', 'VIDEO'] } },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  /** All posts regardless of publish state — admin list view. */
  listAll(companyId: string) {
    return this.prisma.contractorPost.findMany({
      where: { companyId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
  }

  create(companyId: string, rawDto: PostDto & { title: string }) {
    const dto = PostsService.clean(rawDto) as PostDto & { title: string };
    const published = dto.isPublished ?? false;
    return this.prisma.contractorPost.create({
      data: {
        companyId,
        type: dto.type ?? 'TIP',
        title: dto.title,
        body: dto.body,
        videoUrl: dto.videoUrl,
        heroImageUrl: dto.heroImageUrl,
        isPinned: dto.isPinned ?? false,
        isPublished: published,
        publishedAt: published ? new Date() : null,
      },
    });
  }

  private async assertOwned(companyId: string, id: string) {
    const row = await this.prisma.contractorPost.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException(`Post ${id} not found`);
    return row;
  }

  async update(companyId: string, id: string, rawDto: PostDto) {
    const dto = PostsService.clean(rawDto);
    const existing = await this.assertOwned(companyId, id);
    const nowPublishing = dto.isPublished === true && !existing.isPublished;
    const nowUnpublishing = dto.isPublished === false && existing.isPublished;
    return this.prisma.contractorPost.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        ...(dto.heroImageUrl !== undefined && { heroImageUrl: dto.heroImageUrl }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(nowPublishing && { publishedAt: new Date() }),
        ...(nowUnpublishing && { publishedAt: null }),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.assertOwned(companyId, id);
    await this.prisma.contractorPost.delete({ where: { id } });
  }
}
