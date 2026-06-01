import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export interface IotDeviceSnapshot {
  deviceId: string
  name: string
  provider: 'honeywell' | 'nest'
  online: boolean
  currentTempF: number
  humidity: number
  hvacMode: 'HEAT' | 'COOL' | 'AUTO' | 'OFF'
  hvacState: 'HEATING' | 'COOLING' | 'IDLE' | 'OFF'
  heatSetpointF: number
  coolSetpointF: number
  emergencyHeat: boolean
  lastSyncedAt: string
}

export interface ConnectedDevicesResponse {
  provider: string
  connected: boolean
  devices: IotDeviceSnapshot[]
}

export function useMyIotDevices() {
  return useQuery<ConnectedDevicesResponse[]>({
    queryKey: ['customer', 'iot-devices'],
    queryFn: async () => {
      const { data } = await api.get('/crm/iot/my-devices')
      return data
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  })
}

export function useDisconnectMyIot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (provider: string) => {
      await api.delete(`/crm/iot/my-connections/${provider}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'iot-devices'] }),
  })
}

export function useConnectHoneywellPortal() {
  return () => {
    window.location.href = '/api/crm/iot/honeywell/connect-portal'
  }
}

export function useConnectNestPortal() {
  return () => {
    window.location.href = '/api/crm/iot/nest/connect-portal'
  }
}
