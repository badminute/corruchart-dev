const STEGO_MAGIC = 'CSTG';
const STEGO_VERSION = 1;

const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export function addPngMetadata(pngData: Uint8Array, keyword: string, text: string): Uint8Array {
  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);
  const nullByte = new Uint8Array([0]);

  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
  chunkData.set(keywordBytes, 0);
  chunkData.set(nullByte, keywordBytes.length);
  chunkData.set(textBytes, keywordBytes.length + 1);

  const lengthBytes = new Uint8Array(4);
  const length = chunkData.length;
  lengthBytes[0] = (length >> 24) & 0xff;
  lengthBytes[1] = (length >> 16) & 0xff;
  lengthBytes[2] = (length >> 8) & 0xff;
  lengthBytes[3] = length & 0xff;

  const typeBytes = new TextEncoder().encode('tEXt');

  const crcData = new Uint8Array(typeBytes.length + chunkData.length);
  crcData.set(typeBytes, 0);
  crcData.set(chunkData, typeBytes.length);

  const crc = crc32(crcData);
  const crcBytes = new Uint8Array(4);
  crcBytes[0] = (crc >> 24) & 0xff;
  crcBytes[1] = (crc >> 16) & 0xff;
  crcBytes[2] = (crc >> 8) & 0xff;
  crcBytes[3] = crc & 0xff;

  const iendPos = pngData.length - 12;
  const result = new Uint8Array(pngData.length + lengthBytes.length + typeBytes.length + chunkData.length + crcBytes.length);
  result.set(pngData.subarray(0, iendPos), 0);
  result.set(lengthBytes, iendPos);
  result.set(typeBytes, iendPos + lengthBytes.length);
  result.set(chunkData, iendPos + lengthBytes.length + typeBytes.length);
  result.set(crcBytes, iendPos + lengthBytes.length + typeBytes.length + chunkData.length);
  result.set(pngData.subarray(iendPos), iendPos + lengthBytes.length + typeBytes.length + chunkData.length + crcBytes.length);

  return result;
}

export function readPngMetadata(pngData: Uint8Array, keyword: string): string | null {
  if (!pngData || pngData.length < PNG_SIGNATURE.length) return null;

  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (pngData[i] !== PNG_SIGNATURE[i]) {
      return null;
    }
  }

  let pos = PNG_SIGNATURE.length;
  while (pos < pngData.length - 12) {
    if (pos + 8 > pngData.length) break;

    const length = (pngData[pos] << 24) | (pngData[pos + 1] << 16) | (pngData[pos + 2] << 8) | pngData[pos + 3];
    const type = String.fromCharCode(
      pngData[pos + 4],
      pngData[pos + 5],
      pngData[pos + 6],
      pngData[pos + 7]
    );

    if (type === 'tEXt') {
      const chunkData = pngData.subarray(pos + 8, pos + 8 + length);
      let nullPos = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullPos = i;
          break;
        }
      }

      if (nullPos !== -1) {
        const chunkKeyword = new TextDecoder().decode(chunkData.subarray(0, nullPos));
        if (chunkKeyword === keyword) {
          return new TextDecoder().decode(chunkData.subarray(nullPos + 1));
        }
      }
    }

    if (type === 'IEND') break;
    pos += length + 12;
  }

  return null;
}

function buildStegoPayload(text: string): Uint8Array {
  const textBytes = new TextEncoder().encode(text);
  const payload = new Uint8Array(4 + 1 + 4 + textBytes.length);
  payload.set(new TextEncoder().encode(STEGO_MAGIC), 0);
  payload[4] = STEGO_VERSION;

  const length = textBytes.length;
  payload[5] = (length >> 24) & 0xff;
  payload[6] = (length >> 16) & 0xff;
  payload[7] = (length >> 8) & 0xff;
  payload[8] = length & 0xff;

  payload.set(textBytes, 9);
  return payload;
}

function readBitsFromImageData(data: Uint8ClampedArray, bitCount: number): Uint8Array | null {
  const result = new Uint8Array(Math.ceil(bitCount / 8));
  let bitIndex = 0;

  for (let pixelIndex = 0; pixelIndex < data.length && bitIndex < bitCount; pixelIndex += 4) {
    for (let channel = 0; channel < 3 && bitIndex < bitCount; channel++) {
      const byteIndex = bitIndex >> 3;
      const bitPosition = 7 - (bitIndex & 7);
      const bitValue = data[pixelIndex + channel] & 1;
      result[byteIndex] |= bitValue << bitPosition;
      bitIndex++;
    }
  }

  return bitIndex === bitCount ? result : null;
}

export function encodeStegoOnCanvas(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const payload = buildStegoPayload(text);
  const capacity = (imageData.data.length / 4) * 3;
  const requiredBits = payload.length * 8;

  if (requiredBits > capacity) {
    throw new Error(`Steganography payload is too large for this image: ${requiredBits} bits required, ${capacity} bits available.`);
  }

  let bitIndex = 0;
  for (let pixelIndex = 0; pixelIndex < imageData.data.length && bitIndex < requiredBits; pixelIndex += 4) {
    for (let channel = 0; channel < 3 && bitIndex < requiredBits; channel++) {
      const byteIndex = bitIndex >> 3;
      const bitPosition = 7 - (bitIndex & 7);
      const bit = (payload[byteIndex] >> bitPosition) & 1;
      imageData.data[pixelIndex + channel] = (imageData.data[pixelIndex + channel] & 0xfe) | bit;
      bitIndex++;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function decodeStegoFromCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const headerBytes = readBitsFromImageData(imageData, 9 * 8);
  if (!headerBytes) return null;

  const magic = new TextDecoder().decode(headerBytes.subarray(0, 4));
  if (magic !== STEGO_MAGIC) return null;

  const version = headerBytes[4];
  if (version !== STEGO_VERSION) return null;

  const length =
    (headerBytes[5] << 24) |
    (headerBytes[6] << 16) |
    (headerBytes[7] << 8) |
    headerBytes[8];

  const totalBytes = 9 + length;
  const payloadBytes = readBitsFromImageData(imageData, totalBytes * 8);
  if (!payloadBytes) return null;

  try {
    return new TextDecoder().decode(payloadBytes.subarray(9));
  } catch {
    return null;
  }
}

async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for steganography decode'));
    };
    image.src = url;
  });
}

export async function decodeStegoFromPngBlob(blob: Blob): Promise<string | null> {
  let bitmap: ImageBitmap | null = null;

  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(blob);
    }
  } catch {
    bitmap = null;
  }

  let canvas: HTMLCanvasElement | null = document.createElement('canvas');
  let ctx = canvas.getContext('2d');

  if (!ctx) return null;

  if (bitmap) {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return decodeStegoFromCanvas(canvas);
  }

  const image = await loadImageFromBlob(blob);
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0);
  return decodeStegoFromCanvas(canvas);
}
