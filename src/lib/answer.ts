export const normalizeAnswerToNumber = (
  value: string | number,
): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const raw = value.trim();
  if (!raw) return null;

  // Convert LaTeX fraction like \frac{a}{b}
  const fracMatch = raw.match(/\\frac\s*\{(-?\d+(?:\.\d+)?)\}\s*\{(-?\d+(?:\.\d+)?)\}/);
  if (fracMatch) {
    const numerator = Number(fracMatch[1]);
    const denominator = Number(fracMatch[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
    return null;
  }

  // Simple fraction like a/b
  const simpleFrac = raw.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (simpleFrac) {
    const numerator = Number(simpleFrac[1]);
    const denominator = Number(simpleFrac[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
    return null;
  }

  const normalized = raw.replace(",", "."); // allow decimal comma
  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) return parsed;

  return null;
};

export const isAnswerCorrect = (
  expected: number | string,
  actual: number | string,
  tolerance = 1e-9,
): boolean => {
  const expectedNumber = normalizeAnswerToNumber(expected);
  const actualNumber = normalizeAnswerToNumber(actual);
  if (expectedNumber !== null && actualNumber !== null) {
    return Math.abs(expectedNumber - actualNumber) <= tolerance;
  }
  return String(expected).trim() === String(actual).trim();
};
