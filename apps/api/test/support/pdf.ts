export function pageCount(pdf: Buffer): number {
  return pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0
}

export function isPdf(pdf: Buffer): boolean {
  return pdf.subarray(0, 5).toString('latin1') === '%PDF-'
}
