export function isValidNhsNumber(rawNhs: string): boolean {
  const clean = rawNhs.replace(/\D/g, '');
  if (clean.length !== 10) return false;

  // Modulus 11 check algorithm for NHS numbers
  let total = 0;
  for (let i = 0; i < 9; i++) {
    total += parseInt(clean[i], 10) * (10 - i);
  }
  const remainder = total % 11;
  const checkDigit = (11 - remainder) % 11;

  if (checkDigit === 10) return false;
  return checkDigit === parseInt(clean[9], 10);
}

export function validateClinicalRanges(data: {
  psa?: number;
  percentPositiveCoresWorst?: number;
  percentPositiveCoresBest?: number;
  ukbScore?: number;
  bloodLossMl?: number;
  durationMinutes?: number;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.psa !== undefined && (data.psa < 0 || data.psa > 500)) {
    errors.psa = 'PSA must be between 0 and 500 ng/mL';
  }
  if (data.percentPositiveCoresWorst !== undefined && (data.percentPositiveCoresWorst < 1 || data.percentPositiveCoresWorst > 100)) {
    errors.percentPositiveCoresWorst = 'Percent positive cores (worst) must be between 1% and 100%';
  }
  if (data.percentPositiveCoresBest !== undefined && (data.percentPositiveCoresBest < 1 || data.percentPositiveCoresBest > 100)) {
    errors.percentPositiveCoresBest = 'Percent positive cores (best) must be between 1% and 100%';
  }
  if (data.ukbScore !== undefined && (data.ukbScore < 1 || data.ukbScore > 100)) {
    errors.ukbScore = 'UKB score must be between 1 and 100';
  }
  if (data.bloodLossMl !== undefined && (data.bloodLossMl < 50 || data.bloodLossMl > 2500)) {
    errors.bloodLossMl = 'Blood loss is typically between 100 and 1500 mL';
  }
  if (data.durationMinutes !== undefined && (data.durationMinutes < 30 || data.durationMinutes > 600)) {
    errors.durationMinutes = 'Duration of operation must be between 30 and 600 mins';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
