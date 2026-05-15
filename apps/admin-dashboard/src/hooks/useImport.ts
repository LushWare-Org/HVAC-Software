import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Platform = 'jobber' | 'hcp' | 'generic' | 'equipment'
export type ImportStatus = 'VALIDATING' | 'READY' | 'IMPORTING' | 'DONE' | 'FAILED' | 'ROLLED_BACK'

export interface ColumnMap {
  csvHeader: string
  targetField: string
}

export interface DetectResult {
  batchId: string
  platform: Platform
  columnMap: ColumnMap[]
  headers: string[]
  preview: Record<string, string>[]
  totalRows: number
}

export interface ValidationError {
  rowNumber: number
  field: string
  message: string
  rawData: Record<string, string>
}

export interface ValidationWarning {
  type: string
  message: string
  count: number
}

export interface ValidationResult {
  totalRows: number
  willImport: number
  willSkip: number
  willFail: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ImportBatch {
  id: string
  source: Platform
  status: ImportStatus
  totalRows: number
  imported: number
  skipped: number
  failed: number
  createdAt: string
  completedAt?: string
  createdBy: string
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useImportDetect() {
  return useMutation({
    mutationFn: async (file: File): Promise<DetectResult> => {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/crm/import/detect', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
  })
}

export function useImportValidate() {
  return useMutation({
    mutationFn: async (data: { batchId: string; columnMap: ColumnMap[] }): Promise<ValidationResult> => {
      const res = await api.post('/crm/import/validate', data)
      return res.data
    },
  })
}

export function useImportStart() {
  return useMutation({
    mutationFn: async (data: { batchId: string; columnMap: ColumnMap[] }): Promise<{ batchId: string }> => {
      const res = await api.post('/crm/import/start', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import', 'batches'] })
    },
  })
}

export function useImportRollback() {
  return useMutation({
    mutationFn: async (batchId: string) => {
      const res = await api.delete(`/crm/import/batches/${batchId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import', 'batches'] })
    },
  })
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useImportBatches() {
  return useQuery<ImportBatch[]>({
    queryKey: ['import', 'batches'],
    queryFn: async () => {
      const res = await api.get('/crm/import/batches')
      return res.data
    },
  })
}

export function useImportBatch(batchId: string | null, enabled = true) {
  return useQuery<ImportBatch>({
    queryKey: ['import', 'batch', batchId],
    queryFn: async () => {
      const res = await api.get(`/crm/import/batches/${batchId}`)
      return res.data
    },
    enabled: !!batchId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status || status === 'DONE' || status === 'FAILED' || status === 'ROLLED_BACK') return false
      return 400
    },
  })
}

// ── Progress polling hook ─────────────────────────────────────────────────────

export function useImportProgress(
  batchId: string | null,
  onDone?: (batch: ImportBatch) => void,
) {
  const batchQuery = useImportBatch(batchId, !!batchId)
  const doneCalledRef = useRef(false)

  useEffect(() => {
    if (!batchQuery.data) return
    const { status } = batchQuery.data
    if ((status === 'DONE' || status === 'FAILED') && !doneCalledRef.current) {
      doneCalledRef.current = true
      onDone?.(batchQuery.data)
    }
  }, [batchQuery.data, onDone])

  // Reset done flag when batchId changes
  useEffect(() => { doneCalledRef.current = false }, [batchId])

  return batchQuery
}

// ── Target fields reference ───────────────────────────────────────────────────

export const CUSTOMER_TARGET_FIELDS = [
  { field: 'fullName',   label: 'Full Name (auto-split)', required: false },
  { field: 'firstName',  label: 'First Name',   required: true },
  { field: 'lastName',   label: 'Last Name',    required: true },
  { field: 'email',      label: 'Email',        required: false },
  { field: 'phone',      label: 'Phone',        required: false },
  { field: 'mobile',     label: 'Mobile',       required: false },
  { field: 'address',    label: 'Address',      required: false },
  { field: 'city',       label: 'City',         required: false },
  { field: 'state',      label: 'State',        required: false },
  { field: 'zipCode',    label: 'Zip Code',     required: false },
  { field: 'type',       label: 'Type',         required: false },
  { field: 'notes',      label: 'Notes',        required: false },
  { field: '__ignore__', label: '— Ignore —',   required: false },
]

export const EQUIPMENT_TARGET_FIELDS = [
  { field: 'customerEmail', label: 'Customer Email (to link)', required: true },
  { field: 'type',          label: 'Equipment Type',           required: true },
  { field: 'brand',         label: 'Brand',                    required: false },
  { field: 'model',         label: 'Model',                    required: false },
  { field: 'serialNo',      label: 'Serial Number',            required: false },
  { field: 'installDate',   label: 'Install Date',             required: false },
  { field: 'warrantyEnd',   label: 'Warranty End',             required: false },
  { field: 'notes',         label: 'Notes',                    required: false },
  { field: '__ignore__',    label: '— Ignore —',               required: false },
]

// ── Admin (super_admin) hooks ─────────────────────────────────────────────────

export interface AdminImportBatch extends ImportBatch {
  companyId: string
  companyName: string
}

export interface AdminStats {
  totalBatches: number
  byStatus: Record<string, number>
  totalImported: number
  totalSkipped: number
  totalFailed: number
}

export function useAdminImportStats() {
  return useQuery<AdminStats>({
    queryKey: ['import', 'admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/crm/import/admin/stats')
      return res.data
    },
    staleTime: 30_000,
  })
}

export function useAdminImportCompanies() {
  return useQuery<{ id: string; name: string }[]>({
    queryKey: ['import', 'admin', 'companies'],
    queryFn: async () => {
      const res = await api.get('/crm/import/admin/companies')
      return res.data
    },
    staleTime: 60_000,
  })
}

export function useAdminImportBatches(page: number, companyId?: string) {
  return useQuery<{ data: AdminImportBatch[]; total: number; page: number; limit: number }>({
    queryKey: ['import', 'admin', 'batches', page, companyId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (companyId) params.set('companyId', companyId)
      const res = await api.get(`/crm/import/admin/batches?${params}`)
      return res.data
    },
  })
}

export function useAdminImportRollback() {
  return useMutation({
    mutationFn: async (batchId: string) => {
      const res = await api.delete(`/crm/import/admin/batches/${batchId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import', 'admin'] })
    },
  })
}
