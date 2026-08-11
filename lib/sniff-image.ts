/**
 * Detects image format from actual file bytes rather than the
 * client-supplied MIME type, which is trivially spoofable. Only the
 * extension returned here is ever used for the saved filename and the
 * Content-Type the file is served back with.
 */
export function sniffImageExtension(buffer: Buffer): 'png' | 'jpg' | 'webp' | 'avif' | null {
  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }

  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand.startsWith('av')) return 'avif';
  }

  return null;
}
