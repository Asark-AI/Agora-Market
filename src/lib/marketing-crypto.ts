import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export function encryptMarketingSecret(plaintext: string, key: Buffer): string {
  if (key.length !== 32) throw new Error('Marketing encryption key must be 32 bytes.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return `v1.${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptMarketingSecret(value: string, key: Buffer): string {
  if (key.length !== 32) throw new Error('Marketing encryption key must be 32 bytes.');
  const [version, ivPart, tagPart, dataPart] = value.split('.');
  if (version !== 'v1' || !ivPart || !tagPart || !dataPart) {
    throw new Error('Stored marketing secret is invalid.');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
