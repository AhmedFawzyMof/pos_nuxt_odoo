export function parseWeightBarcode(
  barcode: string,
): { productCode: string; weightKg: number } | null {
  if (barcode.length !== 13) return null;

  const splitAt = 7;
  const productCode = barcode.substring(0, splitAt);
  const weightStr = barcode.substring(splitAt, 12);

  const weightGrams = parseInt(weightStr, 10);
  if (isNaN(weightGrams) || weightGrams <= 0) return null;

  return { productCode, weightKg: weightGrams / 1000 };
}

export function tryWeightBarcodeSearch(
  query: string,
): { searchQuery: string; weightKg: number | null } {
  const parsed = parseWeightBarcode(query);
  if (parsed) {
    return { searchQuery: parsed.productCode, weightKg: parsed.weightKg };
  }
  return { searchQuery: query, weightKg: null };
}
