import { Injectable, Logger } from '@nestjs/common';

export interface NestTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;   // 3600 seconds = 1 hour
  token_type: string;
}

export interface NestDevice {
  name: string;        // enterprises/{id}/devices/{id}
  type: string;        // sdm.devices.types.THERMOSTAT
  traits: {
    'sdm.devices.traits.Info'?: { customName: string };
    'sdm.devices.traits.Connectivity'?: { status: 'ONLINE' | 'OFFLINE' };
    'sdm.devices.traits.Temperature'?: { ambientTemperatureCelsius: number };
    'sdm.devices.traits.Humidity'?: { ambientHumidityPercent: number };
    'sdm.devices.traits.ThermostatMode'?: { mode: 'HEAT' | 'COOL' | 'HEATCOOL' | 'OFF' };
    'sdm.devices.traits.ThermostatHvac'?: { status: 'HEATING' | 'COOLING' | 'OFF' };
    'sdm.devices.traits.ThermostatTemperatureSetpoint'?: {
      heatCelsius?: number;
      coolCelsius?: number;
    };
  };
  parentRelations: Array<{ displayName: string }>;
}

@Injectable()
export class NestClient {
  private readonly logger = new Logger(NestClient.name);
  private readonly projectId = process.env.NEST_PROJECT_ID ?? '';
  private readonly clientId = process.env.NEST_CLIENT_ID ?? '';
  private readonly clientSecret = process.env.NEST_CLIENT_SECRET ?? '';
  private readonly redirectUri = process.env.NEST_REDIRECT_URI ?? '';
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly sdmBase = 'https://smartdevicemanagement.googleapis.com/v1';

  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      redirect_uri: this.redirectUri,
      access_type: 'offline',
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/sdm.service',
      client_id: this.clientId,
      state,
    });
    return `https://nestservices.google.com/partnerconnections/${this.projectId}/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<NestTokenResponse> {
    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    if (!res.ok) throw new Error(`Nest token exchange failed: ${await res.text()}`);
    return res.json() as Promise<NestTokenResponse>;
  }

  async refreshToken(token: string): Promise<NestTokenResponse> {
    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    if (!res.ok) throw new Error(`Nest token refresh failed: ${await res.text()}`);
    return res.json() as Promise<NestTokenResponse>;
  }

  async listDevices(accessToken: string): Promise<NestDevice[]> {
    const res = await fetch(
      `${this.sdmBase}/enterprises/${this.projectId}/devices`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) {
      this.logger.warn(`Nest listDevices failed: ${res.status}`);
      return [];
    }
    const body = await res.json() as { devices?: NestDevice[] };
    return body.devices ?? [];
  }

  // Extract a short device ID from the full resource name
  deviceIdFromName(name: string): string {
    return name.split('/').pop() ?? name;
  }
}
