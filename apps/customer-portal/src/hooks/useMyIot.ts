import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useToast } from '../contexts/ToastContext'

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

// The connect endpoints need the login token, which a plain browser navigation
// can't send. Ask for the provider URL over the authenticated client, then go there.
function useConnectPortal(provider: 'honeywell' | 'nest') {
  const { showError } = useToast()
  return async () => {
    try {
      const { data } = await api.get<{ url: string }>(`/crm/iot/${provider}/connect-portal-url`)
      window.location.href = data.url
    } catch {
      showError('We could not start the connection. Please try again in a moment.', 'Connection failed')
    }
  }
}

export function useConnectHoneywellPortal() {
  return useConnectPortal('honeywell')
}

export function useConnectNestPortal() {
  return useConnectPortal('nest')
}
