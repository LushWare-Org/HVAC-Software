import { hostFromHostUri, devApiBaseUrl, devWsBaseUrl } from './devHost'

describe('hostFromHostUri', () => {
  it('extracts the LAN IP Metro is served from', () => {
    expect(hostFromHostUri('192.168.1.5:8081')).toBe('192.168.1.5')
  })

  it('handles a host with no port', () => {
    expect(hostFromHostUri('192.168.1.5')).toBe('192.168.1.5')
  })

  it('returns null when there is nothing to derive from', () => {
    expect(hostFromHostUri(undefined)).toBeNull()
    expect(hostFromHostUri(null)).toBeNull()
    expect(hostFromHostUri('')).toBeNull()
  })
})

describe('dev base URLs', () => {
  it('points the API at the machine running the services, not the device', () => {
    expect(devApiBaseUrl('192.168.1.5:8081')).toBe('http://192.168.1.5:80/api')
  })

  it('points the socket at the same host without the /api suffix', () => {
    expect(devWsBaseUrl('192.168.1.5:8081')).toBe('http://192.168.1.5:80')
  })

  it('falls back to localhost when Expo gives no hostUri', () => {
    expect(devApiBaseUrl(undefined)).toBe('http://localhost:80/api')
    expect(devWsBaseUrl(undefined)).toBe('http://localhost:80')
  })
})
