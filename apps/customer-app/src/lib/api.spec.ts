import { normalizeApiBaseUrl } from './api'

describe('normalizeApiBaseUrl', () => {
  it('appends /api when missing', () => {
    expect(normalizeApiBaseUrl('https://gw.example.com')).toBe('https://gw.example.com/api')
  })

  it('leaves an existing /api suffix alone', () => {
    expect(normalizeApiBaseUrl('https://gw.example.com/api')).toBe('https://gw.example.com/api')
  })

  it('strips a trailing slash before deciding', () => {
    expect(normalizeApiBaseUrl('https://gw.example.com/api/')).toBe('https://gw.example.com/api')
    expect(normalizeApiBaseUrl('https://gw.example.com/')).toBe('https://gw.example.com/api')
  })

  it('falls back to the hvactor gateway for an empty value', () => {
    expect(normalizeApiBaseUrl('')).toContain('nginx-gateway-536584181394')
  })
})
