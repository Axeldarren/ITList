// Client-side AES-GCM utilities compatible with server middleware
// Primary: Web Crypto API (secure contexts / HTTPS + localhost)
// Fallback: node-forge (pure JS) so encryption still works over plain HTTP in internal networks.
// Both paths derive a 32-byte key via SHA-256(secret) to match the server.

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let cachedKey: CryptoKey | null = null;

export function isWebCryptoAvailable(): boolean {
  // In browsers, require secure context and subtle
  if (typeof window !== 'undefined') {
    return !!(window.isSecureContext && globalThis.crypto && globalThis.crypto.subtle);
  }
  // In Node (SSR), SubtleCrypto may be available via webcrypto
  const c = globalThis.crypto as Crypto | undefined;
  return !!(c && c.subtle);
}

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || '';
  if (!secret) throw new Error('NEXT_PUBLIC_ENCRYPTION_SECRET not configured');
  if (!isWebCryptoAvailable()) {
    throw new Error('WebCrypto SubtleCrypto not available');
  }
  const hash = await globalThis.crypto!.subtle!.digest('SHA-256', textEncoder.encode(secret));
  cachedKey = await globalThis.crypto!.subtle!.importKey(
    'raw',
    hash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return cachedKey;
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function encryptJson(data: unknown): Promise<{ iv: string; data: string }> {
  // Prefer WebCrypto if available; otherwise fall back to node-forge (pure JS)
  if (isWebCryptoAvailable()) {
    const key = await getKey();
    const iv = globalThis.crypto!.getRandomValues(new Uint8Array(12));
    const plaintext = textEncoder.encode(JSON.stringify(data));
    const cipherWithTag = await globalThis.crypto!.subtle!.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext
    ); // WebCrypto output includes auth tag appended (16 bytes)
    return { iv: bufToB64(iv.buffer), data: bufToB64(cipherWithTag) };
  }

  // Fallback: node-forge AES-GCM with separate auth tag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forge: any = await import('node-forge');
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || '';
  if (!secret) throw new Error('NEXT_PUBLIC_ENCRYPTION_SECRET not configured');
  const md = forge.md.sha256.create();
  md.update(secret, 'utf8');
  const keyBytes: string = md.digest().getBytes(); // 32-byte binary string

  // Use crypto.getRandomValues if present; otherwise forge's PRNG
  let ivU8 = new Uint8Array(12);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    ivU8 = globalThis.crypto.getRandomValues(new Uint8Array(12));
  } else {
    const ivStr: string = forge.random.getBytesSync(12);
    ivU8 = Uint8Array.from(ivStr, (c: string) => (c as unknown as number).valueOf());
    for (let i = 0; i < ivStr.length; i++) ivU8[i] = ivStr.charCodeAt(i);
  }

  const ivStr = String.fromCharCode.apply(null, Array.from(ivU8));
  const cipher = forge.cipher.createCipher('AES-GCM', keyBytes);
  const plaintextStr = JSON.stringify(data);
  cipher.start({ iv: ivStr, tagLength: 128 });
  cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(plaintextStr)));
  const success: boolean = cipher.finish();
  if (!success) throw new Error('AES-GCM encryption failed');
  const outputBytes: string = cipher.output.getBytes();
  const tagBytes: string = cipher.mode.tag.getBytes();

  // Combine ciphertext + tag to keep same shape (single data field)
  const combined = new Uint8Array(outputBytes.length + tagBytes.length);
  for (let i = 0; i < outputBytes.length; i++) combined[i] = outputBytes.charCodeAt(i);
  for (let i = 0; i < tagBytes.length; i++) combined[outputBytes.length + i] = tagBytes.charCodeAt(i);

  return { iv: bufToB64(ivU8.buffer), data: bufToB64(combined.buffer) };
}

export async function decryptJson<T = unknown>(envelope: { iv: string; data: string; tag?: string }): Promise<T> {
  if (isWebCryptoAvailable()) {
    const key = await getKey();
    const iv = new Uint8Array(b64ToBuf(envelope.iv));
    let cipherWithTag: ArrayBuffer;
    if (envelope.tag) {
      // Concatenate data + tag for WebCrypto
      const dataBuf = new Uint8Array(b64ToBuf(envelope.data));
      const tagBuf = new Uint8Array(b64ToBuf(envelope.tag));
      const combined = new Uint8Array(dataBuf.length + tagBuf.length);
      combined.set(dataBuf, 0);
      combined.set(tagBuf, dataBuf.length);
      cipherWithTag = combined.buffer;
    } else {
      cipherWithTag = b64ToBuf(envelope.data);
    }
    const plaintext = await globalThis.crypto!.subtle!.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherWithTag
    );
    const text = textDecoder.decode(new Uint8Array(plaintext));
    return JSON.parse(text) as T;
  }

  // Fallback: node-forge AES-GCM decryption
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forge: any = await import('node-forge');
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || '';
  if (!secret) throw new Error('NEXT_PUBLIC_ENCRYPTION_SECRET not configured');
  const md = forge.md.sha256.create();
  md.update(secret, 'utf8');
  const keyBytes: string = md.digest().getBytes();

  const ivU8 = new Uint8Array(b64ToBuf(envelope.iv));
  const ivStr = String.fromCharCode.apply(null, Array.from(ivU8));
  const dataU8 = new Uint8Array(b64ToBuf(envelope.data));
  let tagU8: Uint8Array | null = null;
  if (envelope.tag) {
    tagU8 = new Uint8Array(b64ToBuf(envelope.tag));
  } else {
    // Last 16 bytes are the tag when combined
    if (dataU8.length < 16) throw new Error('Invalid encrypted payload');
    tagU8 = dataU8.slice(dataU8.length - 16);
  }
  const ctU8 = envelope.tag ? dataU8 : dataU8.slice(0, dataU8.length - 16);

  const decipher = forge.cipher.createDecipher('AES-GCM', keyBytes);
  decipher.start({ iv: ivStr, tagLength: 128, tag: String.fromCharCode.apply(null, Array.from(tagU8)) });
  decipher.update(forge.util.createBuffer(ctU8));
  const ok: boolean = decipher.finish();
  if (!ok) throw new Error('AES-GCM decryption failed');
  const bytes: string = decipher.output.getBytes();
  const text = forge.util.decodeUtf8(bytes);
  return JSON.parse(text) as T;
}

export function isEncryptedEnvelope(obj: unknown): obj is { iv: string; data: string; tag?: string } {
  return !!obj && typeof obj === 'object' && typeof (obj as { iv?: unknown }).iv === 'string' && typeof (obj as { data?: unknown }).data === 'string';
}
