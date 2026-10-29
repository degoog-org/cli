export type ImageDims = { width: number; height: number }

const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
])

const ascii = (buf: Buffer, start: number, end: number): string =>
  buf.toString("ascii", start, end)

const readPngDims = (buf: Buffer): ImageDims | null => {
  if (buf.length < 24 || ascii(buf, 1, 4) !== "PNG") return null
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

const readGifDims = (buf: Buffer): ImageDims | null => {
  if (buf.length < 10 || ascii(buf, 0, 3) !== "GIF") return null
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) }
}

const readWebpDims = (buf: Buffer): ImageDims | null => {
  if (buf.length < 30 || ascii(buf, 0, 4) !== "RIFF" || ascii(buf, 8, 12) !== "WEBP") return null
  const chunk = ascii(buf, 12, 16)
  if (chunk === "VP8 ") {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
  }
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (chunk === "VP8X") {
    return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 }
  }
  return null
}

const readJpegDims = (buf: Buffer): ImageDims | null => {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < buf.length) {
    const marker = buf[i + 1] ?? 0
    if (buf[i] !== 0xff || marker === 0xff) {
      i++
      continue
    }
    if (JPEG_SOF_MARKERS.has(marker)) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) }
    }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return null
}

export const readImageDims = (buf: Buffer): ImageDims | null =>
  readPngDims(buf) ?? readJpegDims(buf) ?? readWebpDims(buf) ?? readGifDims(buf)
