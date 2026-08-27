import { IPSSAnswers, IPSSScore, IPSSSeverity } from '@/types/prom';

export const IPSS_QUESTIONS = [
  {
    key: 'incompleteEmptying',
    title: '1. Incomplete Emptying',
    question: 'Over the past month, how often have you had a sensation of not emptying your bladder completely after you finished urinating?',
    options: [
      { score: 0, label: 'Not at all (0)' },
      { score: 1, label: 'Less than 1 time in 5 (1)' },
      { score: 2, label: 'Less than half the time (2)' },
      { score: 3, label: 'About half the time (3)' },
      { score: 4, label: 'More than half the time (4)' },
      { score: 5, label: 'Almost always (5)' },
    ],
  },
  {
    key: 'frequency',
    title: '2. Frequency',
    question: 'Over the past month, how often have you had to urinate again less than two hours after you finished urinating?',
    options: [
      { score: 0, label: 'Not at all (0)' },
      { score: 1, label: 'Less than 1 time in 5 (1)' },
      { score: 2, label: 'Less than half the time (2)' },
      { score: 3, label: 'About half the time (3)' },
      { score: 4, label: 'More than half the time (4)' },
      { score: 5, label: 'Almost always (5)' },
    ],
  },
  {
    key: 'intermittency',
    title: '3. Intermittency',
    question: 'Over the past month, how often have you found you stopped and started again several times when you urinated?',
    options: [
      { score: 0, label: 'Not at all (0)' },
      { score: 1, label: 'Less than 1 time in 5 (1)' },
      { score: 2, label: 'Less than half the time (2)' },
      { score: 3, label: 'About half the time (3)' },
      { score: 4, label: 'More than half the time (4)' },
      { score: 5, label: 'Almost always (5)' },
    ],
  },
  {
    key: 'urgency',
    title: '4. Urgency',
    question: 'Over the past month, how often have you found it difficult to postpone urination?',
    options: [
      { score: 0, label: 'Not at all (0)' },
      { score: 1, label: 'Less than 1 time in 5 (1)' },
      { score: 2, label: 'Less than half the time (2)' },
      { score: 3, label: 'About half the time (3)' },
      { score: 4, label: 'More than half the time (4)' },
      { score: 5, label: 'Almost always (5)' },
    ],
  },
  {
    key: 'weakStream',
    title: '5. Weak Stream',
    question: 'Over the past month, how often have you had a weak urinary stream?',
    options: [
      { score: 0, label: 'Not at all (0)' },
      { score: 1, label: 'Less than 1 time in 5 (1)' },
      { score: 2, label: 'Less than half the time (2)' },
      { score: 3, label: 'About half the time (3)' },
      { score: 4, label: 'More than half the time (4)' },
      { score: 5, label: 'Almost always (5)' },
    ],
  },
  {
    key: 'straining',
    title: '6. Straining',
    question: 'Over the past month, how often have you had to push or strain to begin urination?',
    options: [
      { score: 0, label: 'Not at all (0)' },
      { score: 1, label: 'Less than 1 time in 5 (1)' },
      { score: 2, label: 'Less than half the time (2)' },
      { score: 3, label: 'About half the time (3)' },
      { score: 4, label: 'More than half the time (4)' },
      { score: 5, label: 'Almost always (5)' },
    ],
  },
  {
    key: 'nocturia',
    title: '7. Nocturia',
    question: 'Over the past month, how many times did you most typically get up to urinate from the time you went to bed until the time you got up in the morning?',
    options: [
      { score: 0, label: 'None (0)' },
      { score: 1, label: '1 time (1)' },
      { score: 2, label: '2 times (2)' },
      { score: 3, label: '3 times (3)' },
      { score: 4, label: '4 times (4)' },
      { score: 5, label: '5 or more times (5)' },
    ],
  },
];

export const IPSS_QOL_OPTIONS = [
  { score: 0, label: 'Delighted (0)' },
  { score: 1, label: 'Pleased (1)' },
  { score: 2, label: 'Mostly Satisfied (2)' },
  { score: 3, label: 'Mixed / Equally Satisfied and Dissatisfied (3)' },
  { score: 4, label: 'Mostly Dissatisfied (4)' },
  { score: 5, label: 'Unhappy (5)' },
  { score: 6, label: 'Terrible (6)' },
];

export function calculateIpssScore(answers: IPSSAnswers): IPSSScore {
  const totalScore = 
    (answers.incompleteEmptying || 0) +
    (answers.frequency || 0) +
    (answers.intermittency || 0) +
    (answers.urgency || 0) +
    (answers.weakStream || 0) +
    (answers.straining || 0) +
    (answers.nocturia || 0);

  let severity: IPSSSeverity = 'Mild';
  if (totalScore >= 20) {
    severity = 'Severe';
  } else if (totalScore >= 8) {
    severity = 'Moderate';
  }

  return {
    totalScore,
    qualityOfLife: answers.qualityOfLife ?? 0,
    severity,
  };
}
