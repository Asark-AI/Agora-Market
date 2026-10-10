export const VISUAL_SEARCH_MAX_BYTES = 4 * 1024 * 1024;

export const VISUAL_SEARCH_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type VisualSearchImageType = (typeof VISUAL_SEARCH_IMAGE_TYPES)[number];

export function isVisualSearchImageType(value: string): value is VisualSearchImageType {
  return VISUAL_SEARCH_IMAGE_TYPES.some((type) => type === value);
}

function hasReasonableDimensions(width: number, height: number) {
  return width > 0 && height > 0 && width <= 12_000 && height <= 12_000 && width * height <= 25_000_000;
}

export function validateVisualSearchImage(bytes: Uint8Array, contentType: string) {
  if (!isVisualSearchImageType(contentType)) {
    return 'Upload a JPEG, PNG, or WebP image.';
  }

  if (bytes.byteLength === 0 || bytes.byteLength > VISUAL_SEARCH_MAX_BYTES) {
    return 'Choose an image smaller than 4 MB.';
  }

  const pngWidth = (bytes[16] * 0x1000000) + (bytes[17] << 16) + (bytes[18] << 8) + bytes[19];
  const pngHeight = (bytes[20] * 0x1000000) + (bytes[21] << 16) + (bytes[22] << 8) + bytes[23];
  const isPng = contentType === 'image/png'
    && bytes.byteLength >= 33
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
    && bytes[12] === 0x49
    && bytes[13] === 0x48
    && bytes[14] === 0x44
    && bytes[15] === 0x52
    && bytes[8] === 0
    && bytes[9] === 0
    && bytes[10] === 0
    && bytes[11] === 13
    && hasReasonableDimensions(pngWidth, pngHeight)
    && bytes.at(-8) === 0x49
    && bytes.at(-7) === 0x45
    && bytes.at(-6) === 0x4e
    && bytes.at(-5) === 0x44
    && bytes.at(-12) === 0
    && bytes.at(-11) === 0
    && bytes.at(-10) === 0
    && bytes.at(-9) === 0;
  let hasJpegFrame = false;
  let jpegOffset = 2;
  const hasJpegSignature = contentType === 'image/jpeg'
    && bytes.byteLength >= 12
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes.at(-2) === 0xff
    && bytes.at(-1) === 0xd9;
  if (hasJpegSignature) {
    while (jpegOffset < bytes.byteLength - 2) {
      if (bytes[jpegOffset] !== 0xff) break;
      while (bytes[jpegOffset] === 0xff) jpegOffset += 1;
      const marker = bytes[jpegOffset];
      jpegOffset += 1;
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (marker === 0xd9 || marker === 0xda) break;
      if (jpegOffset + 2 > bytes.byteLength) break;
      const segmentLength = (bytes[jpegOffset] << 8) | bytes[jpegOffset + 1];
      if (segmentLength < 2 || jpegOffset + segmentLength > bytes.byteLength) break;
      const isFrameMarker = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
      if (isFrameMarker && segmentLength >= 7) {
        const height = (bytes[jpegOffset + 3] << 8) | bytes[jpegOffset + 4];
        const width = (bytes[jpegOffset + 5] << 8) | bytes[jpegOffset + 6];
        hasJpegFrame = hasReasonableDimensions(width, height);
      }
      jpegOffset += segmentLength;
    }
  }
  const isJpeg = hasJpegSignature && hasJpegFrame;
  const webpChunkSize = bytes[16] | (bytes[17] << 8) | (bytes[18] << 16) | (bytes[19] << 24);
  const webpExtendedWidth = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
  const webpExtendedHeight = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
  const webpLossyWidth = ((bytes[26] | (bytes[27] << 8)) & 0x3fff);
  const webpLossyHeight = ((bytes[28] | (bytes[29] << 8)) & 0x3fff);
  const webpLosslessWidth = 1 + ((bytes[22] & 0x3f) << 8) + bytes[21];
  const webpLosslessHeight = 1 + ((bytes[24] & 0x0f) << 10) + (bytes[23] << 2) + ((bytes[22] & 0xc0) >> 6);
  const validWebpExtended = bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58
    && webpChunkSize === 10 && hasReasonableDimensions(webpExtendedWidth, webpExtendedHeight);
  const validWebpLossy = bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20
    && webpChunkSize >= 10 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a
    && hasReasonableDimensions(webpLossyWidth, webpLossyHeight);
  const validWebpLossless = bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4c
    && webpChunkSize >= 5 && bytes[20] === 0x2f
    && hasReasonableDimensions(webpLosslessWidth, webpLosslessHeight);
  const isWebp = contentType === 'image/webp'
    && bytes.byteLength >= 30
    && bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && (((bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)) >>> 0) === bytes.byteLength - 8)
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50
    && (validWebpExtended || validWebpLossy || validWebpLossless);

  return isPng || isJpeg || isWebp ? null : 'The file contents do not match a supported image type.';
}
