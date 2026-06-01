import { Injectable, Logger } from '@nestjs/common';

export interface HoneywellTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface HoneywellDevice {
  deviceID: string;
  name: string;
  userDefinedDeviceName: string;
  locationId: number;
  indoorTemperature: number;
  indoorHumidity: number;
  outdoorTemperature?: number;
  outdoorHumidity?: number;
  operationStatus: { mode: string };
  changeableValues: {
    mode: string;
    heatSetpoint: number;
    coolSetpoint: number;
    emergencyHeatActive?: boolean;
  };
  scheduleStatus: string;
  isAlive: boolean;
}

export interface HoneywellLocation {
  locationID: number;
  name: string;
  devices: HoneywellDevice[];
}

@Injectable()
export class HoneywellClient {
  private readonly logger = new Logger(HoneywellClient.name);
  private readonly baseUrl = 'https://api.honeywell.com';
  private readonly clientId = process.env.RESIDEO_CLIENT_ID ?? '';
  private readonly clientSecret = process.env.RESIDEO_CLIENT_SECRET ?? '';
  private readonly redirectUri = process.env.RESIDEO_REDIRECT_URI ?? '';

  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
    });
    return `${this.baseUrl}/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<HoneywellTokenResponse> {
    const creds = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Honeywell token exchange failed: ${err}`);
    }
    return res.json() as Promise<HoneywellTokenResponse>;
  }

  async refreshToken(token: string): Promise<HoneywellTokenResponse> {
    const creds = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Honeywell token refresh failed: ${err}`);
    }
    return res.json() as Promise<HoneywellTokenResponse>;
  }

  async getLocations(accessToken: string): Promise<HoneywellLocation[]> {
    const res = await fetch(
      `${this.baseUrl}/v2/locations?apikey=${this.clientId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) {
      this.logger.warn(`Honeywell locations fetch failed: ${res.status}`);
      return [];
    }
    return res.json() as Promise<HoneywellLocation[]>;
  }

  async getDevice(accessToken: string, deviceId: string, locationId: string): Promise<HoneywellDevice | null> {
    const res = await fetch(
      `${this.baseUrl}/v2/devices/thermostats/${deviceId}?apikey=${this.clientId}&locationId=${locationId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) {
      this.logger.warn(`Honeywell device fetch failed: ${res.status} for device ${deviceId}`);
      return null;
    }
    return res.json() as Promise<HoneywellDevice>;
  }
}
