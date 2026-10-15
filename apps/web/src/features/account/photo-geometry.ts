export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export function radiansOf(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function rotatedSize({ width, height }: Size, degrees: number): Size {
  const angle = radiansOf(degrees)
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  return { width: width * cos + height * sin, height: width * sin + height * cos }
}

export function centeredSquare({ width, height }: Size): CropArea {
  const side = Math.min(width, height)
  return { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side }
}

export function quarterTurn(rotation: number, direction: 1 | -1): number {
  return (((rotation + direction * 90) % 360) + 360) % 360
}

export function usableArea(area: CropArea): CropArea | null {
  const values = [area.x, area.y, area.width, area.height]
  return values.every(Number.isFinite) && area.width > 0 && area.height > 0 ? area : null
}
