export interface ParsedWeightBarcode {
  productCode: string;
  weightKg: number;
  isWeightBarcode: true;
  format: 'primary' | 'fallback';
  rawBarcode: string;
}

export function parseWeightBarcode(
  rawBarcode: string,
): ParsedWeightBarcode | null {
  const barcode = (rawBarcode ?? '').trim();
  if (!/^\d{13}$/.test(barcode)) {
    console.info('[WEIGHT-BARCODE] rejected (not 13 digits):', JSON.stringify(rawBarcode));
    return null;
  }

  // PRIMARY: 7-digit product + 5-digit weight (grams) + 1 check
  const primaryProductCode = barcode.substring(0, 7);
  const primaryWeightStr = barcode.substring(7, 12);
  const primaryWeightGrams = parseInt(primaryWeightStr, 10);

  if (primaryWeightGrams > 0 && Number.isFinite(primaryWeightGrams)) {
    const result: ParsedWeightBarcode = {
      productCode: primaryProductCode,
      weightKg: primaryWeightGrams / 1000,
      isWeightBarcode: true,
      format: 'primary',
      rawBarcode: barcode,
    };
    console.info(
      '[WEIGHT-BARCODE] parsed primary:',
      JSON.stringify(result),
    );
    return result;
  }

  // FALLBACK (Legacy): 6-digit product + "80" + 4-digit weight (grams) + 1 check
  // Only used when primary weight is 0 (unrealistic mapping)
  if (isLegacyFormat(barcode)) {
    const legacyProductCode = barcode.substring(0, 6);
    const legacyWeightStr = barcode.substring(8, 12);
    const legacyWeightGrams = parseInt(legacyWeightStr, 10);

    if (legacyWeightGrams > 0 && Number.isFinite(legacyWeightGrams)) {
      const result: ParsedWeightBarcode = {
        productCode: legacyProductCode,
        weightKg: legacyWeightGrams / 1000,
        isWeightBarcode: true,
        format: 'fallback',
        rawBarcode: barcode,
      };
      console.info(
        '[WEIGHT-BARCODE] parsed fallback:',
        JSON.stringify(result),
      );
      return result;
    }
  }

  console.info('[WEIGHT-BARCODE] no valid weight found:', JSON.stringify(barcode));
  return null;
}

function isLegacyFormat(barcode: string): boolean {
  return barcode.length === 13 &&
    /^\d{6}80\d{4}\d$/.test(barcode);
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
