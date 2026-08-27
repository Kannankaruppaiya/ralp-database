import { ExtractedField } from '@/types/ingestion';

export function parseTheatreNoteText(rawText: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // Surgeon Regex
  const surgeonMatch = rawText.match(/(?:Surgeon|Lead Surgeon|Consultant):\s*(VK|RDM|CI|OAK|OTHER)/i);
  if (surgeonMatch) {
    fields.push({
      id: `ext-surg-${Date.now()}`,
      fieldKey: 'surgeon',
      fieldLabel: 'Primary Surgeon',
      category: 'Operation',
      rawValue: surgeonMatch[0],
      normalizedValue: surgeonMatch[1].toUpperCase(),
      confidence: 98,
      status: 'exact',
      hasConflict: false,
    });
  }

  // Bladder neck Regex
  const bnMatch = rawText.match(/Bladder neck:\s*(sparing|slight wide|wide needing reconstruction)/i);
  if (bnMatch) {
    fields.push({
      id: `ext-bn-${Date.now()}`,
      fieldKey: 'bladderNeck',
      fieldLabel: 'Bladder Neck Preservation',
      category: 'Operation',
      rawValue: bnMatch[0],
      normalizedValue: bnMatch[1].toLowerCase(),
      confidence: 95,
      status: 'exact',
      hasConflict: false,
    });
  }

  // Nerve sparing Regex
  const nsMatch = rawText.match(/Nerve sparing:\s*(Bilateral|Right|Left|None)/i);
  if (nsMatch) {
    fields.push({
      id: `ext-ns-${Date.now()}`,
      fieldKey: 'nerveSparing',
      fieldLabel: 'Nerve Sparing Extent',
      category: 'Operation',
      rawValue: nsMatch[0],
      normalizedValue: nsMatch[1],
      confidence: 96,
      status: 'exact',
      hasConflict: false,
    });
  }

  return fields;
}
