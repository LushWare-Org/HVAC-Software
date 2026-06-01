/**
 * useIot.ts — Hooks for customer IoT device data
 * Routes → /api/crm/iot/*
 */
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

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

export function useCustomerIotDevices(customerId: string | undefined) {
  return useQuery<ConnectedDevicesResponse[]>({
    queryKey: ['iot-devices', customerId],
    queryFn: async () => {
      const res = await api.get(`/crm/iot/customers/${customerId}/devices`)
      return res.data
    },
    enabled: !!customerId,
    refetchInterval: 5 * 60 * 1000, // every 5 min — matches Honeywell rate limit
    staleTime: 4 * 60 * 1000,
  })
}

export function useDisconnectIot(customerId: string) {
  return useMutation({
    mutationFn: async (provider: string) => {
      await api.delete(`/crm/iot/customers/${customerId}/connections/${provider}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices', customerId] })
    },
  })
}

export function useDevSeedIot(customerId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/crm/iot/dev-seed/${customerId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices', customerId] })
    },
  })
}

export function useConnectHoneywell(customerId: string) {
  return () => {
    window.location.href = `/api/crm/iot/honeywell/connect?customerId=${customerId}`
  }
}

export function useConnectNest(customerId: string) {
  return () => {
    window.location.href = `/api/crm/iot/nest/connect?customerId=${customerId}`
  }
}

export interface IotHistoryPoint {
  recordedAt: string
  snapshot: IotDeviceSnapshot
}

export function useIotDeviceHistory(deviceId: string | undefined, hours = 24) {
  return useQuery<IotHistoryPoint[]>({
    queryKey: ['iot-device-history', deviceId, hours],
    queryFn: async () => {
      const res = await api.get(`/crm/iot/devices/${deviceId}/history`, { params: { hours } })
      return res.data
    },
    enabled: !!deviceId,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  })
}

export function useSendIotConnectLink(customerId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/crm/iot/customers/${customerId}/connect-link`)
      return res.data
    },
  })
}

export function useDevTriggerIotAlerts(customerId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/crm/iot/dev-trigger-alerts`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices', customerId] })
      queryClient.invalidateQueries({ queryKey: ['iot-device-history'] })
    },
  })
}
