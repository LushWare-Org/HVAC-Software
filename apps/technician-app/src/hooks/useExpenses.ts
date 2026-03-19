import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Expense, CreateExpenseDto, PaginatedResponse } from '@/types/api'

interface ExpenseFilters {
  page?: number
  limit?: number
  category?: string
  jobId?: string
}

/**
 * Get my expenses
 */
export function useMyExpenses(filters: ExpenseFilters = {}) {
  const { user, isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.expenses({ ...filters, technicianId: user?.id }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (user?.id) params.set('technicianId', user.id)
      if (filters.category) params.set('category', filters.category)
      if (filters.jobId) params.set('jobId', filters.jobId)
      params.set('page', String(filters.page ?? 1))
      params.set('limit', String(filters.limit ?? 50))
      const res = await api.get<PaginatedResponse<Expense>>(`/finance/expenses?${params.toString()}`)
      return res.data
    },
    enabled: isAuthenticated && !!user?.id,
  })
}

/**
 * Get single expense detail
 */
export function useExpenseDetail(expenseId: string) {
  return useQuery({
    queryKey: queryKeys.expenseDetail(expenseId),
    queryFn: async () => {
      const res = await api.get<Expense>(`/finance/expenses/${expenseId}`)
      return res.data
    },
    enabled: !!expenseId,
  })
}

/**
 * Create a new expense
 */
export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateExpenseDto) => {
      const res = await api.post<Expense>('/finance/expenses', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
