import { ExtractedField } from '@/types/ingestion';

/**
 * Pulls structured RALP fields out of the free text of a theatre note or clinic
 * letter.
 *
 * Deliberately regex, not a model: theatre notes here follow the unit's
 * dictation template, the vocabulary is a closed set of enum values, and a
 * wrong Gleason score is worse than a missed one. Every field is presented for
 * a clinician to confirm before it reaches a record — nothing here writes.
 *
 * Anything the patterns cannot find is simply absent from the result; the
 * review screen then shows it as not extracted rather than guessing.
 */

type Rule = {
  key: string;
  label: string;
  category: ExtractedField['category'];
  pattern: RegExp;
  /** Confidence reflects how specific the pattern is, not model certainty. */
  confidence: number;
  normalise?: (m: RegExpMatchArray) => unknown;
};

const GLEASON = '[3-5]\\s*\\+\\s*[3-5]';

const RULES: Rule[] = [
  // ---------------------------------------------------------- identifiers
  {
    key: 'nhsNumber', label: 'NHS Number', category: 'Demographics',
    pattern: /NHS(?:\s*(?:No|Number))?[:\s]*((?:\d[\s-]?){10})/i,
    confidence: 99,
    normalise: (m) => m[1].replace(/\D/g, ''),
  },
  {
    // Not used to match — only to cross-check the identifier match below.
    key: 'surname', label: 'Surname (for verification)', category: 'Demographics',
    pattern: /(?:^|\n)\s*Patient(?:\s*name)?[:\s]*([A-Z][A-Za-z'-]+)\s*,/,
    confidence: 80,
    normalise: (m) => m[1],
  },
  {
    key: 'hospitalNumber', label: 'Hospital Number (MRN)', category: 'Demographics',
    pattern: /(?:MRN|Hospital(?:\s*No|\s*Number)?)[:\s]*([A-Z]{2,6}-?\d{3,8})/i,
    confidence: 96,
    normalise: (m) => m[1].toUpperCase(),
  },

  // ---------------------------------------------------------- baseline
  {
    key: 'psa', label: 'Pre-op PSA', category: 'Baseline Cancer',
    pattern: /PSA[:\s]*(\d+(?:\.\d+)?)\s*(?:ng\/?m[lL])?/i,
    confidence: 94,
    normalise: (m) => Number(m[1]),
  },
  {
    key: 'gleasonGrade', label: 'Biopsy Gleason', category: 'Baseline Cancer',
    pattern: new RegExp(`(?:Biopsy\\s+)?Gleason(?:\\s+score)?[:\\s]*(${GLEASON})`, 'i'),
    confidence: 95,
    normalise: (m) => m[1].replace(/\s/g, ''),
  },
  {
    key: 'clinicalStage', label: 'Clinical Stage', category: 'Baseline Cancer',
    pattern: /Clinical\s+stage[:\s]*(?:c?T?)(2[ABC]|3[AB]|4)/i,
    confidence: 92,
    normalise: (m) => m[1].toUpperCase(),
  },
  {
    key: 'ukbScore', label: 'UKB Score', category: 'Baseline Cancer',
    pattern: /UKB(?:\s*score)?[:\s]*(\d{1,3})/i,
    confidence: 90,
    normalise: (m) => Number(m[1]),
  },

  // ---------------------------------------------------------- operation
  {
    key: 'surgeon', label: 'Primary Surgeon', category: 'Operation',
    pattern: /(?:Lead\s+)?(?:Surgeon|Consultant)[:\s]*(VK|RDM|CI|OAK|OTHER)\b/i,
    confidence: 98,
    normalise: (m) => m[1].toUpperCase(),
  },
  {
    key: 'operationDate', label: 'Operation Date', category: 'Operation',
    pattern: /(?:Date\s+of\s+(?:operation|surgery)|Operation\s+date)[:\s]*(\d{4}-\d{2}-\d{2}|\d{1,2}[/.]\d{1,2}[/.]\d{2,4})/i,
    confidence: 93,
    normalise: (m) => normaliseDate(m[1]),
  },
  {
    key: 'bladderNeck', label: 'Bladder Neck', category: 'Operation',
    pattern: /Bladder\s*neck[:\s]*(sparing|slight\s+wide|wide\s+needing\s+reconstruction)/i,
    confidence: 95,
    normalise: (m) => m[1].toLowerCase().replace(/\s+/g, ' '),
  },
  {
    key: 'nerveSparing', label: 'Nerve Sparing', category: 'Operation',
    pattern: /Nerve\s*sparing[:\s]*(Bilateral|Right|Left|None)/i,
    confidence: 96,
    normalise: (m) => m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(),
  },
  {
    key: 'leftNerveSparingGrade', label: 'Left Nerve Sparing Grade', category: 'Operation',
    pattern: /(?:L(?:eft)?)[\s:]*([2-5]\s*\/\s*5)/i,
    confidence: 85,
    normalise: (m) => m[1].replace(/\s/g, ''),
  },
  {
    key: 'rightNerveSparingGrade', label: 'Right Nerve Sparing Grade', category: 'Operation',
    pattern: /(?:R(?:ight)?)[\s:]*([2-5]\s*\/\s*5)/i,
    confidence: 85,
    normalise: (m) => m[1].replace(/\s/g, ''),
  },
  {
    key: 'sphincter', label: 'Sphincter', category: 'Operation',
    pattern: /Sphincter[:\s]*(Weak|Good|Excellent)/i,
    confidence: 92,
    normalise: (m) => title(m[1]),
  },
  {
    key: 'anteriorReconstruction', label: 'Anterior Reconstruction', category: 'Operation',
    pattern: /Anterior\s+reconstruction[:\s]*(Weak|Good|Excellent)/i,
    confidence: 92,
    normalise: (m) => title(m[1]),
  },
  {
    key: 'lymphNodeDissection', label: 'Lymph Node Dissection', category: 'Operation',
    pattern: /Lymph\s*node\s*dissection[:\s]*(yes|no)/i,
    confidence: 94,
    normalise: (m) => m[1].toLowerCase() === 'yes',
  },
  {
    key: 'bloodLossMl', label: 'Estimated Blood Loss', category: 'Operation',
    pattern: /(?:EBL|Blood\s*loss)[:\s]*(\d{2,4})\s*m[lL]?/i,
    confidence: 93,
    normalise: (m) => Number(m[1]),
  },
  {
    key: 'durationMinutes', label: 'Operating Time', category: 'Operation',
    pattern: /(?:Duration(?:\s+of\s+op)?|Operating\s+time)[:\s]*(\d{2,4})\s*(?:mins?|minutes)?/i,
    confidence: 91,
    normalise: (m) => Number(m[1]),
  },

  // ---------------------------------------------------------- histology
  {
    key: 'pathologicalStage', label: 'Pathological Stage', category: 'Histology',
    pattern: /(?:Pathological\s+stage|pT)[:\s]*(?:p?T?)(2[ABC]|3[AB]|4)/i,
    confidence: 93,
    normalise: (m) => m[1].toUpperCase(),
  },
  {
    key: 'surgicalMargins', label: 'Surgical Margins', category: 'Histology',
    pattern: /Margins?[:\s]*(negative|positive|R0|R1)/i,
    confidence: 92,
    normalise: (m) =>
      /neg|R0/i.test(m[1]) ? 'Negative (R0)' : 'Positive (R1)',
  },
  {
    key: 'extraprostaticExtension', label: 'Extraprostatic Extension', category: 'Histology',
    pattern: /(?:EPE|Extraprostatic\s+extension)[:\s]*(yes|no|present|absent)/i,
    confidence: 90,
    normalise: (m) => /yes|present/i.test(m[1]),
  },
  {
    key: 'seminalVesicleInvasion', label: 'Seminal Vesicle Invasion', category: 'Histology',
    pattern: /(?:SVI|Seminal\s+vesicle\s+invasion)[:\s]*(yes|no|present|absent)/i,
    confidence: 90,
    normalise: (m) => /yes|present/i.test(m[1]),
  },
];

function title(s: string) {
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

/** Accepts ISO, or UK day-first with / or . separators. */
function normaliseDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const [d, m, y] = raw.split(/[/.]/);
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function parseClinicalDocument(rawText: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  RULES.forEach((rule, i) => {
    const m = rawText.match(rule.pattern);
    if (!m) return;

    fields.push({
      id: `ext-${rule.key}-${i}`,
      fieldKey: rule.key,
      fieldLabel: rule.label,
      category: rule.category,
      rawValue: m[0].trim(),
      normalizedValue: rule.normalise ? rule.normalise(m) : m[1],
      confidence: rule.confidence,
      status: rule.confidence >= 92 ? 'exact' : 'inferred',
      hasConflict: false,
    });
  });

  return fields;
}

/** Kept for the original call sites. */
export const parseTheatreNoteText = parseClinicalDocument;

/**
 * Reads the identifiers the parser found so a document can be attached to the
 * right record. NHS number and hospital number only — matching on name alone is
 * not safe enough to link a clinical document to a patient.
 */
export function extractIdentifiers(fields: ExtractedField[]) {
  const get = (key: string) => fields.find((f) => f.fieldKey === key)?.normalizedValue as string | undefined;
  return {
    nhsNumber: get('nhsNumber'),
    hospitalNumber: get('hospitalNumber'),
    surname: get('surname'),
  };
}
