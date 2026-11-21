import type { SubjectId } from '../data/syllabusData';

export interface BoardQuizQuestion {
  id: string;
  subjectId: SubjectId;
  subjectLabel: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export const BOARD_QUESTIONS: BoardQuizQuestion[] = [
  // Maths
  {
    id: 'q-m1',
    subjectId: 'maths',
    subjectLabel: 'Maths',
    prompt: 'If α and β are zeroes of x² − 5x + 6, what is α + β?',
    options: ['5', '−5', '6', '1/6'],
    correctIndex: 0,
    explanation: 'Sum of zeroes = −b/a = −(−5)/1 = 5.',
  },
  {
    id: 'q-m2',
    subjectId: 'maths',
    subjectLabel: 'Maths',
    prompt: 'What is the value of sin² 30° + cos² 30°?',
    options: ['0', '1/2', '1', '√3/2'],
    correctIndex: 2,
    explanation: 'Fundamental identity: sin²θ + cos²θ = 1 for all θ.',
  },
  {
    id: 'q-m3',
    subjectId: 'maths',
    subjectLabel: 'Maths',
    prompt: 'A tangent to a circle intersects it in how many points?',
    options: ['Two points', 'Exactly one point', 'Infinite points', 'Zero points'],
    correctIndex: 1,
    explanation: 'By Theorem 10.1, a tangent touches the circle at exactly one point of contact.',
  },
  {
    id: 'q-m4',
    subjectId: 'maths',
    subjectLabel: 'Maths',
    prompt: 'The discriminant of 2x² − 4x + 2 = 0 is:',
    options: ['8', '−8', '0', '16'],
    correctIndex: 2,
    explanation: 'D = b² − 4ac = (−4)² − 4(2)(2) = 16 − 16 = 0 (two equal real roots).',
  },
  // Science
  {
    id: 'q-s1',
    subjectId: 'science',
    subjectLabel: 'Science',
    prompt: 'Which gas is evolved when dilute HCl reacts with zinc granules?',
    options: ['Oxygen', 'Carbon dioxide', 'Hydrogen', 'Chlorine'],
    correctIndex: 2,
    explanation: 'Zn + 2HCl → ZnCl₂ + H₂↑ (burns with a pop sound).',
  },
  {
    id: 'q-s2',
    subjectId: 'science',
    subjectLabel: 'Science',
    prompt: 'The SI unit of electric power is:',
    options: ['Joule', 'Watt', 'Ohm', 'Ampere'],
    correctIndex: 1,
    explanation: 'Power P = VI = Work/Time, measured in Watts (1 W = 1 J/s).',
  },
  {
    id: 'q-s3',
    subjectId: 'science',
    subjectLabel: 'Science',
    prompt: 'Which part of the human brain maintains posture and balance?',
    options: ['Cerebrum', 'Medulla', 'Cerebellum', 'Hypothalamus'],
    correctIndex: 2,
    explanation: 'The cerebellum in the hindbrain coordinates precision of voluntary actions and posture.',
  },
  {
    id: 'q-s4',
    subjectId: 'science',
    subjectLabel: 'Science',
    prompt: 'A concave mirror forms a virtual, erect and magnified image when the object is:',
    options: ['At infinity', 'Beyond C', 'At F', 'Between P and F'],
    correctIndex: 3,
    explanation: 'Between pole (P) and principal focus (F), concave mirrors act like shaving/dentist mirrors.',
  },
  // SST
  {
    id: 'q-sst1',
    subjectId: 'sst',
    subjectLabel: 'SST',
    prompt: 'Who hosted the Congress of Vienna in 1815?',
    options: ['Giuseppe Mazzini', 'Duke Metternich', 'Otto von Bismarck', 'Napoleon'],
    correctIndex: 1,
    explanation: 'Austrian Chancellor Duke Metternich hosted the Treaty of Vienna (1815).',
  },
  {
    id: 'q-sst2',
    subjectId: 'sst',
    subjectLabel: 'SST',
    prompt: 'Which soil is ideal for growing cotton and is also called Regur soil?',
    options: ['Alluvial soil', 'Laterite soil', 'Black soil', 'Red soil'],
    correctIndex: 2,
    explanation: 'Black (Regur) soil retains moisture well and covers the Deccan trap region.',
  },
  {
    id: 'q-sst3',
    subjectId: 'sst',
    subjectLabel: 'SST',
    prompt: 'In India, who issues currency notes on behalf of the Central Government?',
    options: ['SBI', 'Reserve Bank of India', 'NITI Aayog', 'Finance Ministry'],
    correctIndex: 1,
    explanation: 'RBI holds the sole authority to issue currency notes in India (Money & Credit).',
  },
  {
    id: 'q-sst4',
    subjectId: 'sst',
    subjectLabel: 'SST',
    prompt: 'Belgium solved its ethnic tension by adopting which principle?',
    options: ['Majoritarianism', 'Power Sharing', 'Unitary rule', 'Military rule'],
    correctIndex: 1,
    explanation: 'Belgium amended its constitution 4 times for equal representation and Community Government.',
  },
  // English Communicative (Course A — Code 101)
  {
    id: 'q-e1',
    subjectId: 'english',
    subjectLabel: 'English Comm.',
    prompt: 'In "Two Gentlemen of Verona", why did Nicola and Jacopo work so hard?',
    options: ['To buy a bicycle', 'To pay for sister Lucia’s treatment', 'To migrate to America', 'To open a shop'],
    correctIndex: 1,
    explanation: 'They worked multiple jobs to pay hospital fees for their sister Lucia suffering from tuberculosis.',
  },
  {
    id: 'q-e2',
    subjectId: 'english',
    subjectLabel: 'English Comm.',
    prompt: 'In "Julius Caesar", who delivers the famous "Friends, Romans, countrymen" speech?',
    options: ['Marcus Brutus', 'Cassius', 'Mark Antony', 'Decius Brutus'],
    correctIndex: 2,
    explanation: 'Mark Antony subtly turns the Roman mob against the conspirators using irony.',
  },
  {
    id: 'q-e3',
    subjectId: 'english',
    subjectLabel: 'English Comm.',
    prompt: 'What did Patol Babu receive as his single dialogue in the film?',
    options: ['"Stop!"', '"Oh!"', '"Alas!"', '"Wait!"'],
    correctIndex: 1,
    explanation: 'Patol Babu rehearsed his monosyllabic exclamation "Oh!" with complete artistic dedication.',
  },
  {
    id: 'q-e4',
    subjectId: 'english',
    subjectLabel: 'English Comm.',
    prompt: 'In Shelley’s "Ozymandias", what does the shattered statue symbolize?',
    options: ['Eternal military glory', 'Impermanence of power and pride', 'Nature’s weakness', 'True friendship'],
    correctIndex: 1,
    explanation: 'Even the mightiest tyrant’s empire crumbles to boundless, bare sands over time.',
  },
  // Hindi Course A
  {
    id: 'q-h1',
    subjectId: 'hindi',
    subjectLabel: 'Hindi A',
    prompt: '"नेताजी का चश्मा" पाठ में मूर्ति पर बार-बार चश्मा कौन बदलता था?',
    options: ['हालदार साहब', 'पानवाला', 'कैप्टन चश्मेवाला', 'मास्टर मोतीलाल'],
    correctIndex: 2,
    explanation: 'कैप्टन चश्मेवाला नेताजी सुभाषचंद्र बोस के प्रति गहरी देशभक्ति रखता था।',
  },
  {
    id: 'q-h2',
    subjectId: 'hindi',
    subjectLabel: 'Hindi A',
    prompt: 'सूरदास के पदों में गोपियों ने उद्धव की तुलना किससे की है?',
    options: ['कमल के पत्ते और तेल की गागर', 'सूरज और चाँद', 'नदी और पहाड़', 'हवा और बादल'],
    correctIndex: 0,
    explanation: 'उद्धव कृष्ण के पास रहकर भी प्रेम के बंधन से अछूते रहे, जैसे जल में कमल का पत्ता।',
  },
  {
    id: 'q-h3',
    subjectId: 'hindi',
    subjectLabel: 'Hindi A',
    prompt: '"माता का अँचल" (कृतिका) पाठ के लेखक कौन हैं?',
    options: ['प्रेमचंद', 'शिवपूजन सहाय', 'मधु कांकरिया', 'अज्ञेय'],
    correctIndex: 1,
    explanation: 'शिवपूजन सहाय ने "देहाती दुनिया" उपन्यास के अंश के रूप में यह पाठ लिखा है।',
  },
  {
    id: 'q-h4',
    subjectId: 'hindi',
    subjectLabel: 'Hindi A',
    prompt: 'जब कर्ता की प्रधानता हो और क्रिया कर्ता के अनुसार चले, तो कौन-सा वाच्य होता है?',
    options: ['कर्मवाच्य', 'भाववाच्य', 'कर्तृवाच्य', 'मिश्रवाच्य'],
    correctIndex: 2,
    explanation: 'कर्तृवाच्य में क्रिया का लिंग और वचन कर्ता के अनुसार होता है।',
  },
  // Artificial Intelligence (Code 417)
  {
    id: 'q-a1',
    subjectId: 'ai',
    subjectLabel: 'AI (417)',
    prompt: 'Which stage of the AI Project Cycle uses the 4Ws Problem Canvas?',
    options: ['Data Acquisition', 'Problem Scoping', 'Modelling', 'Evaluation'],
    correctIndex: 1,
    explanation: 'Problem Scoping defines Who, What, Where, and Why via the 4Ws canvas.',
  },
  {
    id: 'q-a2',
    subjectId: 'ai',
    subjectLabel: 'AI (417)',
    prompt: 'In a Confusion Matrix, Precision equals:',
    options: ['TP / (TP + FP)', 'TP / (TP + FN)', '(TP + TN) / Total', 'FP / (FP + TN)'],
    correctIndex: 0,
    explanation: 'Precision = True Positives divided by all Predicted Positives (TP + FP).',
  },
  {
    id: 'q-a3',
    subjectId: 'ai',
    subjectLabel: 'AI (417)',
    prompt: 'Which NLP technique converts words like "studies" and "studying" to their meaningful dictionary root?',
    options: ['Tokenization', 'Lemmatization', 'Stopword removal', 'Bag of Words'],
    correctIndex: 1,
    explanation: 'Lemmatization produces valid dictionary base words (lemmas), unlike crude stemming.',
  },
  {
    id: 'q-a4',
    subjectId: 'ai',
    subjectLabel: 'AI (417)',
    prompt: 'F1 Score is the harmonic mean of which two metrics?',
    options: ['Accuracy and Error', 'Precision and Recall', 'True Positive and True Negative', 'Bias and Variance'],
    correctIndex: 1,
    explanation: 'F1 = 2 × (Precision × Recall) / (Precision + Recall).',
  },
  // Punjabi (Code 004)
  {
    id: 'q-p1',
    subjectId: 'punjabi',
    subjectLabel: 'Punjabi',
    prompt: 'In Punjabi Sahit Mala, "So Kiu Manda Aakhiye" is a bani composed by:',
    options: ['Guru Nanak Dev Ji', 'Bhai Vir Singh', 'Waris Shah', 'Bulleh Shah'],
    correctIndex: 0,
    explanation: 'Sri Guru Nanak Dev Ji highlighted the dignity and equality of women in this shabad.',
  },
  {
    id: 'q-p2',
    subjectId: 'punjabi',
    subjectLabel: 'Punjabi',
    prompt: 'In Punjabi Vyakaran, what is a word formed by joining two meaningful words (e.g., ਮਾਤਾ-ਪਿਤਾ) called?',
    options: ['Agetar', 'Pichhetar', 'Samasi Shabad', 'Kirya Visheshan'],
    correctIndex: 2,
    explanation: 'Samasi Shabad (compound words) combine two words with a hyphen or direct join.',
  },
  {
    id: 'q-p3',
    subjectId: 'punjabi',
    subjectLabel: 'Punjabi',
    prompt: 'In Punjabi Vangi, "Zafarnama" (Ikangi) is written by:',
    options: ['Dr. Harcharan Singh', 'Gurbakhsh Singh Preetlari', 'Nanak Singh', 'Sant Singh Sekhon'],
    correctIndex: 0,
    explanation: 'Dr. Harcharan Singh authored the historical one-act play Zafarnama in Vangi.',
  },
  {
    id: 'q-p4',
    subjectId: 'punjabi',
    subjectLabel: 'Punjabi',
    prompt: 'The Punjabi idiom (Muhavara) "Eed da Chand Hona" means:',
    options: ['To get angry quickly', 'To appear very rarely', 'To work very hard', 'To celebrate a victory'],
    correctIndex: 1,
    explanation: '"Eed da Chand Hona" describes someone who is seen after a very long time.',
  },
];

export function pickQuestionsForSubject(subjectFilter: SubjectId | 'all'): BoardQuizQuestion[] {
  if (subjectFilter === 'all') return BOARD_QUESTIONS;
  const filtered = BOARD_QUESTIONS.filter((q) => q.subjectId === subjectFilter);
  return filtered.length > 0 ? filtered : BOARD_QUESTIONS;
}
