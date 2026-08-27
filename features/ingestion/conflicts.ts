import { ExtractedField } from '@/types/ingestion';

export function detectConflicts(extracted: ExtractedField[], dbRecord: any): ExtractedField[] {
  return extracted.map((field) => {
    const currentVal = dbRecord?.[field.fieldKey];
    if (currentVal !== undefined && currentVal !== field.normalizedValue) {
      return {
        ...field,
        hasConflict: true,
        currentDbValue: currentVal,
        status: 'conflicted',
        selectedSource: 'extracted',
      };
    }
    return {
      ...field,
      hasConflict: false,
    };
  });
}
