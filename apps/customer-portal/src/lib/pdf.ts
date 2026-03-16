import api from './api'

export async function fetchPdfBlob(path: string): Promise<Blob> {
  const { data } = await api.get(path, { responseType: 'blob' })
  return new Blob([data], { type: 'application/pdf' })
}

export async function viewPdf(path: string): Promise<void> {
  const blob = await fetchPdfBlob(path)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function downloadPdf(path: string, filename: string): Promise<void> {
  const blob = await fetchPdfBlob(path)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
