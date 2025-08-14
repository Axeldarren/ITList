import crypto from 'crypto';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Derive a 32-byte AES key from the provided secret
function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function b64ToBuf(b64: string): Buffer {
  return Buffer.from(b64, 'base64');
}

function bufToB64(buf: Buffer): string {
  return buf.toString('base64');
}

export function createEncryptionMiddleware() {
  const secret = process.env.ENCRYPTION_SECRET || '';
  const key = secret ? deriveKey(secret) : null;

  function decryptPayload(payload: { iv: string; data: string; tag?: string }) {
    if (!key) throw new Error('Encryption key not configured');
    const iv = b64ToBuf(payload.iv);
    const cipherText = b64ToBuf(payload.data);
    const tag = payload.tag ? b64ToBuf(payload.tag) : cipherText.subarray(cipherText.length - 16);
    const actualCipher = payload.tag ? cipherText : cipherText.subarray(0, cipherText.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(actualCipher), decipher.final()]);
    const text = decrypted.toString('utf8');
    return JSON.parse(text);
  }

  function encryptPayload(data: unknown) {
    if (!key) throw new Error('Encryption key not configured');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
    const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return { iv: bufToB64(iv), data: bufToB64(enc), tag: bufToB64(tag) };
  }

  const encryptionMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const encHeader = (req.header('x-encrypted') || '').toLowerCase();
    const shouldDecrypt = encHeader === 'v1' && key;

    if (shouldDecrypt && req.body && typeof req.body === 'object' && 'iv' in req.body && 'data' in req.body) {
      try {
        req.body = decryptPayload(req.body as { iv: string; data: string; tag?: string });
      } catch (e) {
        res.status(400).json({ message: 'Invalid encrypted payload' });
        return;
      }
    }

    // Patch res.json to encrypt JSON responses when header present
    const originalJson = res.json.bind(res);
    const newJson: typeof res.json = (body?: any) => {
      if (shouldDecrypt && key) {
        try {
          const envelope = encryptPayload(body);
          res.set('X-Encrypted', 'v1');
          originalJson(envelope);
          return res;
        } catch (e) {
          res.status(500).send('Encryption failed');
          return res;
        }
      }
      return originalJson(body);
    };
    res.json = newJson;

    next();
  };

  return encryptionMiddleware;
}
