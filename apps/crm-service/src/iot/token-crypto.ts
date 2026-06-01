import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-cbc'

function getKey(): Buffer {
  const raw = process.env.IOT_ENCRYPTION_KEY ?? ''
  if (!raw) return Buffer.alloc(32, 0) // dev fallback — zero key
  const buf = Buffer.from(raw, 'hex')
  if (buf.length !== 32) throw new Error('IOT_ENCRYPTION_KEY must be 32 bytes hex (64 hex chars)')
  return buf
}

export function encryptToken(plain: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + enc.toString('hex')
}

export function decryptToken(stored: string): string {
  const key = getKey()
  const [ivHex, encHex] = stored.split(':')
  if (!ivHex || !encHex) return stored // already plain (legacy row)
  const iv = Buffer.from(ivHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const decipher = createDecipheriv(ALGO, key, iv)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
