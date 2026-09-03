/**
 * Medical-Aware Tokenizer for RALP Clinical Search & RAG.
 *
 * Preserves compound oncological entities (Gleason 3+4, pT3b, R0/R1, Nerve Sparing,
 * PSA thresholds) that standard generic tokenizers corrupt by splitting on punctuation.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i',
  'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
  'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'patient', 'patients', 'case', 'cases', 'show',
  'find', 'list', 'give', 'get'
]);

export interface TokenizedDocument {
  raw: string;
  tokens: string[];
  terms: Map<string, number>;
  totalTerms: number;
}

/**
 * Normalizes and extracts medical tokens.
 */
export function tokenizeMedicalText(text: string): string[] {
  if (!text) return [];

  const normalized = text.toLowerCase();
  const tokens: string[] = [];

  // 1. Extract compound medical patterns first
  // Gleason grades: 3+3, 3+4, 4+3, 4+5, etc.
  const gleasonMatches = normalized.match(/\b[3-5]\s*\+\s*[3-5]\b/g);
  if (gleasonMatches) {
    for (const g of gleasonMatches) {
      tokens.push(g.replace(/\s+/g, ''));
      tokens.push(`gleason_${g.replace(/\s+/g, '')}`);
    }
  }

  // Pathological/Clinical Stages: pt2a, pt3b, ct1c, stage 3a, etc.
  const stageMatches = normalized.match(/\b[cp]?t[1-4][a-c]?\b/g);
  if (stageMatches) {
    for (const s of stageMatches) {
      tokens.push(s);
      // Also push clean version e.g. pt3b -> t3b and 3b
      const clean = s.replace(/^[cp]/, '');
      tokens.push(clean);
    }
  }

  // Margin status: r0, r1, rx, positive margin, negative margin
  if (/\b(?:r0|negative\s*margins?)\b/i.test(normalized)) {
    tokens.push('r0');
    tokens.push('negative_margin');
  }
  if (/\b(?:r1|positive\s*margins?)\b/i.test(normalized)) {
    tokens.push('r1');
    tokens.push('positive_margin');
  }

  // Nerve sparing: bilateral, unilateral, left, right, none
  if (/\bbilateral\b/i.test(normalized)) tokens.push('bilateral_ns');
  if (/\bunilateral\b/i.test(normalized)) tokens.push('unilateral_ns');
  if (/\bnon[- ]?nerve\s*sparing\b|\bno\s*nerve\s*sparing\b/i.test(normalized)) tokens.push('no_ns');

  // Biochemical Recurrence (BCR)
  if (/\bbcr\b|\bbiochemical\s*recurrence\b|\bpsa\s*bounce\b|\brising\s*psa\b/i.test(normalized)) {
    tokens.push('bcr_recurrence');
  }

  // Continence / PROMs
  if (/\bpad[- ]free\b|\b0\s*pads?\b|\bcontinent\b|\bcompletely\s*dry\b/i.test(normalized)) {
    tokens.push('pad_free');
    tokens.push('continent');
  }
  if (/\bleakage\b|\bincontinent\b|\b\d+\s*pads?\b/i.test(normalized)) {
    tokens.push('incontinent');
  }

  // Milestones: 2m, 6m, 12m, 18m, 24m, 30m, 36m
  const milestoneMatches = normalized.match(/\b(?:2|6|12|18|24|30|36)\s*m(?:onths?)?\b/g);
  if (milestoneMatches) {
    for (const m of milestoneMatches) {
      const num = m.replace(/\D/g, '');
      tokens.push(`${num}m`);
    }
  }

  // Surgeon Codes
  const surgeonMatches = normalized.match(/\b(?:surgeon\s+)?(vk|rdm|ci|oak)\b/g);
  if (surgeonMatches) {
    for (const s of surgeonMatches) {
      const code = s.replace(/surgeon\s+/i, '').trim();
      tokens.push(`surgeon_${code}`);
    }
  }

  // 2. Extract general alphanumeric words (excluding stopwords)
  const words = normalized
    .replace(/[^a-z0-9\s_+/-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  for (const w of words) {
    tokens.push(w);
  }

  return Array.from(new Set(tokens));
}

/**
 * Creates term frequency representation for BM25 calculation.
 */
export function buildDocumentVector(text: string): TokenizedDocument {
  const tokens = tokenizeMedicalText(text);
  const terms = new Map<string, number>();

  for (const t of tokens) {
    terms.set(t, (terms.get(t) ?? 0) + 1);
  }

  return {
    raw: text,
    tokens,
    terms,
    totalTerms: tokens.length,
  };
}
