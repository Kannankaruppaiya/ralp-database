import { SHIMAnswers, SHIMScore, SHIMSeverity } from '@/types/prom';

export const SHIM_QUESTIONS = [
  {
    key: 'confidence',
    title: '1. Erection Confidence',
    question: 'How do you rate your confidence that you could get and keep an erection?',
    options: [
      { score: 1, label: 'Very Low (1)' },
      { score: 2, label: 'Low (2)' },
      { score: 3, label: 'Moderate (3)' },
      { score: 4, label: 'High (4)' },
      { score: 5, label: 'Very High (5)' },
    ],
  },
  {
    key: 'firmness',
    title: '2. Erection Firmness',
    question: 'When you had erections with sexual stimulation, how often were your erections hard enough for penetration (entering your partner)?',
    options: [
      { score: 0, label: 'No sexual activity (0)' },
      { score: 1, label: 'Almost never / never (1)' },
      { score: 2, label: 'A few times (much less than half the time) (2)' },
      { score: 3, label: 'Sometimes (about half the time) (3)' },
      { score: 4, label: 'Most times (much more than half the time) (4)' },
      { score: 5, label: 'Almost always / always (5)' },
    ],
  },
  {
    key: 'maintenanceFrequency',
    title: '3. Maintenance Frequency',
    question: 'During sexual intercourse, how often were you able to maintain your erection after you had penetrated (entered) your partner?',
    options: [
      { score: 0, label: 'Did not attempt intercourse (0)' },
      { score: 1, label: 'Almost never / never (1)' },
      { score: 2, label: 'A few times (much less than half the time) (2)' },
      { score: 3, label: 'Sometimes (about half the time) (3)' },
      { score: 4, label: 'Most times (much more than half the time) (4)' },
      { score: 5, label: 'Almost always / always (5)' },
    ],
  },
  {
    key: 'maintenanceDifficulty',
    title: '4. Maintenance Difficulty',
    question: 'During sexual intercourse, how difficult was it to maintain your erection to completion of intercourse?',
    options: [
      { score: 0, label: 'Did not attempt intercourse (0)' },
      { score: 1, label: 'Extremely difficult (1)' },
      { score: 2, label: 'Very difficult (2)' },
      { score: 3, label: 'Difficult (3)' },
      { score: 4, label: 'Slightly difficult (4)' },
      { score: 5, label: 'Not difficult (5)' },
    ],
  },
  {
    key: 'satisfaction',
    title: '5. Intercourse Satisfaction',
    question: 'When you attempted sexual intercourse, how often was it satisfactory for you?',
    options: [
      { score: 0, label: 'Did not attempt intercourse (0)' },
      { score: 1, label: 'Almost never / never (1)' },
      { score: 2, label: 'A few times (much less than half the time) (2)' },
      { score: 3, label: 'Sometimes (about half the time) (3)' },
      { score: 4, label: 'Most times (much more than half the time) (4)' },
      { score: 5, label: 'Almost always / always (5)' },
    ],
  },
];

export function calculateShimScore(answers: SHIMAnswers): SHIMScore {
  const totalScore = 
    (answers.confidence || 1) +
    (answers.firmness || 0) +
    (answers.maintenanceFrequency || 0) +
    (answers.maintenanceDifficulty || 0) +
    (answers.satisfaction || 0);

  let severity: SHIMSeverity = 'Severe ED';
  if (totalScore >= 22) {
    severity = 'No ED';
  } else if (totalScore >= 17) {
    severity = 'Mild ED';
  } else if (totalScore >= 12) {
    severity = 'Mild to Moderate ED';
  } else if (totalScore >= 8) {
    severity = 'Moderate ED';
  }

  return {
    totalScore,
    severity,
  };
}
