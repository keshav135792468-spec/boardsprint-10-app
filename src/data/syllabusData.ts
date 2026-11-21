export type SubjectId =
  | 'maths'
  | 'science'
  | 'sst'
  | 'english'
  | 'hindi'
  | 'ai'
  | 'punjabi';

export type ResourceType =
  | 'NCERT Textbook'
  | 'Competency Workbook'
  | '10-Yr Solved Papers'
  | 'Offline Sample Paper'
  | 'Online Notes & PYQs'
  | 'Reference Video';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  shortName: string;
  code: string;
  accentHex: string;
  resources: ResourceType[];
  chapters: {
    id: string;
    title: string;
    unit: string;
    weightage: 'High' | 'Medium' | 'Core';
    primaryResource: ResourceType;
  }[];
}

export interface StudyBlock {
  id: string;
  dayNumber: number; // 1 to 10 (Nov 21 - Nov 30, 2026)
  dateISO: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  slotLabel: 'Morning Deep Focus' | 'Mid-Morning Practice' | 'Afternoon Core' | 'Evening Languages & AI' | 'Night PYQ & Recall';
  subjectId: SubjectId;
  title: string;
  chaptersCovered: string[];
  resources: ResourceType[];
  deliverable: string;
  linkedVideoId?: string;
}

export interface ReferenceVideo {
  id: string;
  youtubeId: string;
  url: string;
  label: string;
  recommendedSlot: string;
  focusTip: string;
  subjectId: SubjectId | 'all';
}

export const REFERENCE_VIDEOS: ReferenceVideo[] = [
  {
    id: 'vid-1',
    youtubeId: 'VoQRpE1P7A4',
    url: 'https://youtu.be/VoQRpE1P7A4?si=nBuORMOadPpFBWE5',
    label: 'Strategy & Master Revision Briefing 01',
    recommendedSlot: 'Day 1 (Nov 21) · Morning Kickoff',
    focusTip: 'Watch at 1.5x during your Day 1 orientation; note high-weightage chapter order and time-block tips.',
    subjectId: 'all',
  },
  {
    id: 'vid-2',
    youtubeId: '7Q-PwzYiQsU',
    url: 'https://youtu.be/7Q-PwzYiQsU?si=kcZxU-HfSo_Xoiu3',
    label: 'Core Concept & Problem Walkthrough 02',
    recommendedSlot: 'Day 3 (Nov 23) · Afternoon Review',
    focusTip: 'Pause before each solved example, attempt it in your rough notebook first, then compare steps.',
    subjectId: 'science',
  },
  {
    id: 'vid-3',
    youtubeId: 'o0aOTJeMxso',
    url: 'https://youtu.be/o0aOTJeMxso?si=AWVa0CrTSns6Tr7R',
    label: 'Competency & Case-Study Breakdown 03',
    recommendedSlot: 'Day 5 (Nov 25) · Evening Recap',
    focusTip: 'Pair with your Maths/Science/SST Competency Workbook to mark tricky assertion-reason patterns.',
    subjectId: 'maths',
  },
  {
    id: 'vid-4',
    youtubeId: 'hvkRXvgWToQ',
    url: 'https://youtu.be/hvkRXvgWToQ?si=ryOklRX4omB3j32V',
    label: 'Exam Presentation & 10-Year PYQ Guide 04',
    recommendedSlot: 'Day 7 (Nov 27) · Night Recall',
    focusTip: 'Focus on CBSE keyword underlining, step-marking structure, and map/diagram neatness.',
    subjectId: 'sst',
  },
  {
    id: 'vid-5',
    youtubeId: 'Y0iw4eyNauY',
    url: 'https://youtu.be/Y0iw4eyNauY?si=ifHmjBfocRJoBFzN',
    label: 'Final Pre-Board Sprint & Mock Paper Tactics 05',
    recommendedSlot: 'Day 9 (Nov 29) · Pre-Mock Briefing',
    focusTip: 'Apply the 15-minute reading-time strategy during your Day 9 & Day 10 offline sample papers.',
    subjectId: 'all',
  },
];

export const SUBJECTS: SubjectInfo[] = [
  {
    id: 'maths',
    name: 'Mathematics',
    shortName: 'Maths',
    code: 'CBSE 041/241',
    accentHex: '#1D4ED8',
    resources: ['NCERT Textbook', 'Competency Workbook', '10-Yr Solved Papers', 'Offline Sample Paper'],
    chapters: [
      { id: 'm1', title: 'Real Numbers & Polynomials', unit: 'Number Systems & Algebra', weightage: 'Core', primaryResource: 'NCERT Textbook' },
      { id: 'm2', title: 'Pair of Linear Equations in Two Variables', unit: 'Algebra', weightage: 'High', primaryResource: 'Competency Workbook' },
      { id: 'm3', title: 'Quadratic Equations & Arithmetic Progressions', unit: 'Algebra', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'm4', title: 'Triangles (BPT & Similarity Proofs)', unit: 'Geometry', weightage: 'High', primaryResource: '10-Yr Solved Papers' },
      { id: 'm5', title: 'Coordinate Geometry', unit: 'Coordinate Geometry', weightage: 'Medium', primaryResource: 'Competency Workbook' },
      { id: 'm6', title: 'Introduction & Applications of Trigonometry', unit: 'Trigonometry', weightage: 'High', primaryResource: '10-Yr Solved Papers' },
      { id: 'm7', title: 'Circles & Areas Related to Circles', unit: 'Geometry & Mensuration', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'm8', title: 'Surface Areas & Volumes', unit: 'Mensuration', weightage: 'High', primaryResource: 'Competency Workbook' },
      { id: 'm9', title: 'Statistics & Probability', unit: 'Statistics', weightage: 'High', primaryResource: 'Offline Sample Paper' },
    ],
  },
  {
    id: 'science',
    name: 'Science',
    shortName: 'Science',
    code: 'CBSE 086',
    accentHex: '#0F766E',
    resources: ['NCERT Textbook', 'Competency Workbook', '10-Yr Solved Papers', 'Offline Sample Paper'],
    chapters: [
      { id: 's1', title: 'Chemical Reactions & Acids, Bases and Salts', unit: 'Chemistry', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 's2', title: 'Metals & Non-Metals', unit: 'Chemistry', weightage: 'High', primaryResource: 'Competency Workbook' },
      { id: 's3', title: 'Carbon and Its Compounds', unit: 'Chemistry', weightage: 'High', primaryResource: '10-Yr Solved Papers' },
      { id: 's4', title: 'Life Processes (Nutrition, Respiration, Transport, Excretion)', unit: 'Biology', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 's5', title: 'Control & Coordination + How Organisms Reproduce', unit: 'Biology', weightage: 'High', primaryResource: 'Competency Workbook' },
      { id: 's6', title: 'Heredity & Our Environment', unit: 'Biology', weightage: 'Medium', primaryResource: '10-Yr Solved Papers' },
      { id: 's7', title: 'Light — Reflection & Refraction + Human Eye', unit: 'Physics', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 's8', title: 'Electricity & Magnetic Effects of Electric Current', unit: 'Physics', weightage: 'High', primaryResource: 'Competency Workbook' },
    ],
  },
  {
    id: 'sst',
    name: 'Social Science (SST)',
    shortName: 'SST',
    code: 'CBSE 087',
    accentHex: '#B45309',
    resources: ['NCERT Textbook', 'Competency Workbook', '10-Yr Solved Papers', 'Offline Sample Paper'],
    chapters: [
      { id: 'sst1', title: 'Rise of Nationalism in Europe & Nationalism in India', unit: 'History', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'sst2', title: 'Making of a Global World & Print Culture', unit: 'History', weightage: 'Medium', primaryResource: '10-Yr Solved Papers' },
      { id: 'sst3', title: 'Resources, Forest/Wildlife, Water & Agriculture', unit: 'Geography', weightage: 'High', primaryResource: 'Competency Workbook' },
      { id: 'sst4', title: 'Minerals, Manufacturing Industries & Map Work', unit: 'Geography', weightage: 'High', primaryResource: '10-Yr Solved Papers' },
      { id: 'sst5', title: 'Power Sharing, Federalism & Gender, Religion and Caste', unit: 'Civics', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'sst6', title: 'Political Parties & Outcomes of Democracy', unit: 'Civics', weightage: 'High', primaryResource: 'Competency Workbook' },
      { id: 'sst7', title: 'Development, Sectors of Economy, Money & Credit, Globalisation', unit: 'Economics', weightage: 'High', primaryResource: '10-Yr Solved Papers' },
    ],
  },
  {
    id: 'english',
    name: 'English Communicative (Course A)',
    shortName: 'English Comm.',
    code: 'CBSE 101',
    accentHex: '#6D28D9',
    resources: ['NCERT Textbook', '10-Yr Solved Papers', 'Offline Sample Paper', 'Online Notes & PYQs'],
    chapters: [
      { id: 'e1', title: 'Fiction: Two Gentlemen of Verona, Mrs. Packletide’s Tiger, The Letter', unit: 'Literature Reader', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'e2', title: 'Fiction: A Shady Plot, Patol Babu, Virtually True', unit: 'Literature Reader', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'e3', title: 'Poetry: Frog & Nightingale, Not Marble, Ozymandias, Ancient Mariner, Snake', unit: 'Literature Reader', weightage: 'High', primaryResource: '10-Yr Solved Papers' },
      { id: 'e4', title: 'Drama: The Dear Departed & Julius Caesar', unit: 'Literature Reader', weightage: 'High', primaryResource: '10-Yr Solved Papers' },
      { id: 'e5', title: 'Main Course Book Themes + Email, Formal Letter, Article & Grammar', unit: 'Writing & Grammar', weightage: 'High', primaryResource: 'Offline Sample Paper' },
    ],
  },
  {
    id: 'hindi',
    name: 'Hindi Course A',
    shortName: 'Hindi A',
    code: 'CBSE 002',
    accentHex: '#BE123C',
    resources: ['NCERT Textbook', '10-Yr Solved Papers', 'Offline Sample Paper'],
    chapters: [
      { id: 'h1', title: 'Kshitij Kavya: Surdas, Tulsidas, Jaishankar Prasad, Nirala, Nagarjun, Manglesh Dabral', unit: 'Kshitij Part 2', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'h2', title: 'Kshitij Gadya: Netaji ka Chashma, Balgobin Bhagat, Lakhnavi Andaz', unit: 'Kshitij Part 2', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'h3', title: 'Kshitij Gadya: Ek Kahani Yah Bhi, Naubatkhane Mein Ibadat, Sanskriti', unit: 'Kshitij Part 2', weightage: 'Medium', primaryResource: '10-Yr Solved Papers' },
      { id: 'h4', title: 'Kritika Part 2: Mata ka Anchal, Sana-Sana Hath Jodi, Main Kyon Likhta Hoon', unit: 'Kritika Part 2', weightage: 'High', primaryResource: 'NCERT Textbook' },
      { id: 'h5', title: 'Vyakaran (Rachna Vakya, Vachya, Pad Parichay, Alankar) & Lekhan Formats', unit: 'Vyakaran & Lekhan', weightage: 'High', primaryResource: 'Offline Sample Paper' },
    ],
  },
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    shortName: 'AI (417)',
    code: 'CBSE 417',
    accentHex: '#0369A1',
    resources: ['Online Notes & PYQs', 'Offline Sample Paper'],
    chapters: [
      { id: 'a1', title: 'Part A: Employability Skills (Communication, Self-Mgmt, ICT, Entrepreneurial, Green)', unit: 'Employability', weightage: 'Core', primaryResource: 'Online Notes & PYQs' },
      { id: 'a2', title: 'Part B: Revisiting AI Project Cycle & Ethical Frameworks', unit: 'AI Core', weightage: 'High', primaryResource: 'Online Notes & PYQs' },
      { id: 'a3', title: 'Part B: Statistical Data, Computer Vision & Natural Language Processing', unit: 'AI Domains', weightage: 'High', primaryResource: 'Online Notes & PYQs' },
      { id: 'a4', title: 'Part B: Model Evaluation (Confusion Matrix, Accuracy, Precision, Recall, F1)', unit: 'Evaluation', weightage: 'High', primaryResource: 'Offline Sample Paper' },
    ],
  },
  {
    id: 'punjabi',
    name: 'Punjabi',
    shortName: 'Punjabi',
    code: 'CBSE 004',
    accentHex: '#C2410C',
    resources: ['Online Notes & PYQs', '10-Yr Solved Papers'],
    chapters: [
      { id: 'p1', title: 'Sahit Mala — Kavita Bhag (Gurmat, Sufi, Kissa & Bir Kav)', unit: 'Sahit Mala', weightage: 'High', primaryResource: 'Online Notes & PYQs' },
      { id: 'p2', title: 'Sahit Mala — Vartak Bhag (Essays & Character Sketches)', unit: 'Sahit Mala', weightage: 'High', primaryResource: 'Online Notes & PYQs' },
      { id: 'p3', title: 'Vangi — Kahanian & Ikangi (Short Stories & One-Act Plays)', unit: 'Vangi', weightage: 'High', primaryResource: '10-Yr Solved Papers' },
      { id: 'p4', title: 'Punjabi Vyakaran (Samasi, Bahu-Arthak, Kirya Visheshan, Muhavare) & Lekh/Patr', unit: 'Grammar & Writing', weightage: 'High', primaryResource: 'Online Notes & PYQs' },
    ],
  },
];

export const SCHEDULE_DAYS: {
  dayNumber: number;
  dateISO: string;
  displayDate: string;
  weekday: string;
  phase: 'Foundation & Core Finish' | 'Competency & Language Surge' | 'Mock Papers & Pre-Board Readiness';
  theme: string;
}[] = [
  { dayNumber: 1, dateISO: '2026-11-21', displayDate: 'Nov 21', weekday: 'Sat', phase: 'Foundation & Core Finish', theme: 'Algebra, Chemistry Core & Nationalism' },
  { dayNumber: 2, dateISO: '2026-11-22', displayDate: 'Nov 22', weekday: 'Sun', phase: 'Foundation & Core Finish', theme: 'Geometry Proofs, Biology Life Processes & English Fiction' },
  { dayNumber: 3, dateISO: '2026-11-23', displayDate: 'Nov 23', weekday: 'Mon', phase: 'Foundation & Core Finish', theme: 'Trigonometry, Light Physics & Geography Core' },
  { dayNumber: 4, dateISO: '2026-11-24', displayDate: 'Nov 24', weekday: 'Tue', phase: 'Foundation & Core Finish', theme: 'Circles, Carbon Compounds & Civics' },
  { dayNumber: 5, dateISO: '2026-11-25', displayDate: 'Nov 25', weekday: 'Wed', phase: 'Competency & Language Surge', theme: 'Mensuration, Electricity & Hindi Kshitij' },
  { dayNumber: 6, dateISO: '2026-11-26', displayDate: 'Nov 26', weekday: 'Thu', phase: 'Competency & Language Surge', theme: 'Stats/Probability, Biology Genetics, Economics & AI Domains' },
  { dayNumber: 7, dateISO: '2026-11-27', displayDate: 'Nov 27', weekday: 'Fri', phase: 'Competency & Language Surge', theme: 'Complete Punjabi, English Drama/Poetry, Hindi Kritika & SST Maps' },
  { dayNumber: 8, dateISO: '2026-11-28', displayDate: 'Nov 28', weekday: 'Sat', phase: 'Mock Papers & Pre-Board Readiness', theme: 'Full Timed Sample Papers: Maths & Science + Error Log' },
  { dayNumber: 9, dateISO: '2026-11-29', displayDate: 'Nov 29', weekday: 'Sun', phase: 'Mock Papers & Pre-Board Readiness', theme: 'Full Timed Sample Papers: SST, English Comm. & Hindi A' },
  { dayNumber: 10, dateISO: '2026-11-30', displayDate: 'Nov 30', weekday: 'Mon', phase: 'Mock Papers & Pre-Board Readiness', theme: 'AI & Punjabi Final Mocks, Weak-Spot Rescue & Formula Lock-In' },
];

export const STUDY_BLOCKS: StudyBlock[] = [
  // DAY 1 — Nov 21
  {
    id: 'd1-b1', dayNumber: 1, dateISO: '2026-11-21', startTime: '06:00', endTime: '08:30', durationMinutes: 150,
    slotLabel: 'Morning Deep Focus', subjectId: 'maths',
    title: 'Real Numbers, Polynomials & Linear Equations',
    chaptersCovered: ['Real Numbers', 'Polynomials', 'Pair of Linear Equations'],
    resources: ['NCERT Textbook', 'Competency Workbook', 'Reference Video'],
    deliverable: 'Solve all NCERT boxed examples + 15 competency word problems.',
    linkedVideoId: 'vid-1',
  },
  {
    id: 'd1-b2', dayNumber: 1, dateISO: '2026-11-21', startTime: '09:30', endTime: '11:30', durationMinutes: 120,
    slotLabel: 'Mid-Morning Practice', subjectId: 'science',
    title: 'Chemical Reactions & Acids, Bases and Salts',
    chaptersCovered: ['Chemical Reactions & Equations', 'Acids, Bases and Salts'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Write balanced equations sheet + NCERT activity table (pH, salts).',
  },
  {
    id: 'd1-b3', dayNumber: 1, dateISO: '2026-11-21', startTime: '13:30', endTime: '15:30', durationMinutes: 120,
    slotLabel: 'Afternoon Core', subjectId: 'sst',
    title: 'Rise of Nationalism in Europe & Nationalism in India',
    chaptersCovered: ['Rise of Nationalism in Europe', 'Nationalism in India'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Timeline chart (1789–1934) + History map locations.',
  },
  {
    id: 'd1-b4', dayNumber: 1, dateISO: '2026-11-21', startTime: '16:30', endTime: '18:30', durationMinutes: 120,
    slotLabel: 'Evening Languages & AI', subjectId: 'english',
    title: 'English Communicative Fiction Part 1',
    chaptersCovered: ['Two Gentlemen of Verona', 'Mrs. Packletide’s Tiger', 'The Letter'],
    resources: ['NCERT Textbook', 'Online Notes & PYQs'],
    deliverable: 'Character sketch bullet cards + 2 extract-based questions per story.',
  },
  {
    id: 'd1-b5', dayNumber: 1, dateISO: '2026-11-21', startTime: '20:00', endTime: '21:45', durationMinutes: 105,
    slotLabel: 'Night PYQ & Recall', subjectId: 'ai',
    title: 'AI Part A (Employability) & Project Cycle',
    chaptersCovered: ['Employability Skills', 'AI Project Cycle & Ethics'],
    resources: ['Online Notes & PYQs'],
    deliverable: 'Revise 4Ws Problem Canvas & Ethical Frameworks + 25 MCQs.',
  },

  // DAY 2 — Nov 22
  {
    id: 'd2-b1', dayNumber: 2, dateISO: '2026-11-22', startTime: '06:00', endTime: '08:30', durationMinutes: 150,
    slotLabel: 'Morning Deep Focus', subjectId: 'maths',
    title: 'Quadratic Equations, AP & Triangles Proofs',
    chaptersCovered: ['Quadratic Equations', 'Arithmetic Progressions', 'Triangles (BPT)'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Master BPT theorem proof + 20 10-Yr PYQs on AP & Quadratics.',
  },
  {
    id: 'd2-b2', dayNumber: 2, dateISO: '2026-11-22', startTime: '09:30', endTime: '11:30', durationMinutes: 120,
    slotLabel: 'Mid-Morning Practice', subjectId: 'science',
    title: 'Life Processes Complete Diagrams & Pathways',
    chaptersCovered: ['Life Processes'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Practice labelled diagrams (Heart, Nephron, Stomata) + case studies.',
  },
  {
    id: 'd2-b3', dayNumber: 2, dateISO: '2026-11-22', startTime: '13:30', endTime: '15:30', durationMinutes: 120,
    slotLabel: 'Afternoon Core', subjectId: 'sst',
    title: 'Making of a Global World & Print Culture',
    chaptersCovered: ['Making of a Global World', 'Print Culture & Modern World'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Memorize 5-marker points on Gutenberg, Vernacular Press Act, Silk Routes.',
  },
  {
    id: 'd2-b4', dayNumber: 2, dateISO: '2026-11-22', startTime: '16:30', endTime: '18:30', durationMinutes: 120,
    slotLabel: 'Evening Languages & AI', subjectId: 'hindi',
    title: 'Hindi Course A — Kshitij Kavya Khand Complete',
    chaptersCovered: ['Surdas', 'Tulsidas', 'Jaishankar Prasad', 'Nirala', 'Nagarjun', 'Manglesh Dabral'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Write central theme (Bhavarth) for all 6 poems + poetic devices.',
  },
  {
    id: 'd2-b5', dayNumber: 2, dateISO: '2026-11-22', startTime: '20:00', endTime: '21:45', durationMinutes: 105,
    slotLabel: 'Night PYQ & Recall', subjectId: 'punjabi',
    title: 'Punjabi Sahit Mala — Kavita Bhag',
    chaptersCovered: ['Gurmat Kav', 'Sufi Kav', 'Kissa & Bir Kav'],
    resources: ['Online Notes & PYQs', '10-Yr Solved Papers'],
    deliverable: 'Revise Prasang Sahit Vyakhya & Kendri Bhav of key poems.',
  },

  // DAY 3 — Nov 23
  {
    id: 'd3-b1', dayNumber: 3, dateISO: '2026-11-23', startTime: '06:00', endTime: '08:30', durationMinutes: 150,
    slotLabel: 'Morning Deep Focus', subjectId: 'maths',
    title: 'Coordinate Geometry & Full Trigonometry',
    chaptersCovered: ['Coordinate Geometry', 'Introduction to Trigonometry', 'Applications of Trigonometry'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Complete Ex 8.3 identity proofs + 10 Heights & Distances problems.',
  },
  {
    id: 'd3-b2', dayNumber: 3, dateISO: '2026-11-23', startTime: '09:30', endTime: '11:30', durationMinutes: 120,
    slotLabel: 'Mid-Morning Practice', subjectId: 'science',
    title: 'Light (Ray Diagrams & Numericals) & Human Eye',
    chaptersCovered: ['Light — Reflection & Refraction', 'Human Eye & Colourful World'],
    resources: ['NCERT Textbook', 'Competency Workbook', 'Reference Video'],
    deliverable: 'Draw all mirror/lens ray diagrams + solve 15 sign-convention numericals.',
    linkedVideoId: 'vid-2',
  },
  {
    id: 'd3-b3', dayNumber: 3, dateISO: '2026-11-23', startTime: '13:30', endTime: '15:30', durationMinutes: 120,
    slotLabel: 'Afternoon Core', subjectId: 'sst',
    title: 'Geography Part 1: Resources, Forests, Water & Agriculture',
    chaptersCovered: ['Resources & Development', 'Forest & Wildlife', 'Water Resources', 'Agriculture'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Soil types & cropping seasons comparison table + dam map list.',
  },
  {
    id: 'd3-b4', dayNumber: 3, dateISO: '2026-11-23', startTime: '16:30', endTime: '18:30', durationMinutes: 120,
    slotLabel: 'Evening Languages & AI', subjectId: 'english',
    title: 'English Communicative Fiction Part 2',
    chaptersCovered: ['A Shady Plot', 'Patol Babu, Film Star', 'Virtually True'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Solve value-based long answers (120 words) from 10-Yr PYQs.',
  },
  {
    id: 'd3-b5', dayNumber: 3, dateISO: '2026-11-23', startTime: '20:00', endTime: '21:45', durationMinutes: 105,
    slotLabel: 'Night PYQ & Recall', subjectId: 'science',
    title: 'Metals & Non-Metals Rapid Revision',
    chaptersCovered: ['Metals & Non-Metals'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Reactivity series, roasting vs calcination, ionic bonding electron-dot structures.',
  },

  // DAY 4 — Nov 24
  {
    id: 'd4-b1', dayNumber: 4, dateISO: '2026-11-24', startTime: '06:00', endTime: '08:30', durationMinutes: 150,
    slotLabel: 'Morning Deep Focus', subjectId: 'maths',
    title: 'Circles Theorems & Areas Related to Circles',
    chaptersCovered: ['Circles', 'Areas Related to Circles'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Prove both Circle theorems + solve 18 sector/segment competency sums.',
  },
  {
    id: 'd4-b2', dayNumber: 4, dateISO: '2026-11-24', startTime: '09:30', endTime: '11:30', durationMinutes: 120,
    slotLabel: 'Mid-Morning Practice', subjectId: 'science',
    title: 'Carbon and Its Compounds Mastery',
    chaptersCovered: ['Carbon and Its Compounds'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'IUPAC naming, isomers, esterification/saponification & soap micelle diagram.',
  },
  {
    id: 'd4-b3', dayNumber: 4, dateISO: '2026-11-24', startTime: '13:30', endTime: '15:30', durationMinutes: 120,
    slotLabel: 'Afternoon Core', subjectId: 'sst',
    title: 'Civics Complete: Power Sharing to Outcomes of Democracy',
    chaptersCovered: ['Power Sharing', 'Federalism', 'Gender, Religion & Caste', 'Political Parties', 'Outcomes of Democracy'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Belgium vs Sri Lanka case + Party reforms 5-mark structured notes.',
  },
  {
    id: 'd4-b4', dayNumber: 4, dateISO: '2026-11-24', startTime: '16:30', endTime: '18:30', durationMinutes: 120,
    slotLabel: 'Evening Languages & AI', subjectId: 'punjabi',
    title: 'Punjabi Sahit Mala Vartak & Vangi Stories',
    chaptersCovered: ['Vartak Essays', 'Vangi Short Stories'],
    resources: ['Online Notes & PYQs', '10-Yr Solved Papers'],
    deliverable: 'Prepare character sketches (Patra-Chitran) & story summaries.',
  },
  {
    id: 'd4-b5', dayNumber: 4, dateISO: '2026-11-24', startTime: '20:00', endTime: '21:45', durationMinutes: 105,
    slotLabel: 'Night PYQ & Recall', subjectId: 'ai',
    title: 'AI Domains: Data Science, Computer Vision & NLP',
    chaptersCovered: ['Statistical Data', 'Computer Vision', 'Natural Language Processing'],
    resources: ['Online Notes & PYQs'],
    deliverable: 'Practice Bag-of-Words, TF-IDF steps, RGB pixel resolution & CNN basics.',
  },

  // DAY 5 — Nov 25
  {
    id: 'd5-b1', dayNumber: 5, dateISO: '2026-11-25', startTime: '06:00', endTime: '08:30', durationMinutes: 150,
    slotLabel: 'Morning Deep Focus', subjectId: 'maths',
    title: 'Surface Areas & Volumes (Combination of Solids)',
    chaptersCovered: ['Surface Areas & Volumes'],
    resources: ['NCERT Textbook', 'Competency Workbook', 'Reference Video'],
    deliverable: 'Formula card + 15 combined-solid word problems without calculator.',
    linkedVideoId: 'vid-3',
  },
  {
    id: 'd5-b2', dayNumber: 5, dateISO: '2026-11-25', startTime: '09:30', endTime: '11:30', durationMinutes: 120,
    slotLabel: 'Mid-Morning Practice', subjectId: 'science',
    title: 'Electricity & Magnetic Effects of Electric Current',
    chaptersCovered: ['Electricity', 'Magnetic Effects of Electric Current'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Solve 20 Ohm’s Law / series-parallel / Joule’s heating numericals + right-hand thumb & Fleming rules.',
  },
  {
    id: 'd5-b3', dayNumber: 5, dateISO: '2026-11-25', startTime: '13:30', endTime: '15:30', durationMinutes: 120,
    slotLabel: 'Afternoon Core', subjectId: 'hindi',
    title: 'Hindi Course A — Kshitij Gadya Khand All 6 Chapters',
    chaptersCovered: ['Netaji ka Chashma', 'Balgobin Bhagat', 'Lakhnavi Andaz', 'Ek Kahani Yah Bhi', 'Naubatkhane Mein Ibadat', 'Sanskriti'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Answer 20 high-frequency 2-mark & 3-mark questions from 10-Yr PYQs.',
  },
  {
    id: 'd5-b4', dayNumber: 5, dateISO: '2026-11-25', startTime: '16:30', endTime: '18:30', durationMinutes: 120,
    slotLabel: 'Evening Languages & AI', subjectId: 'science',
    title: 'Control & Coordination + How Organisms Reproduce',
    chaptersCovered: ['Control & Coordination', 'How do Organisms Reproduce'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Reflex arc, plant hormones table, human & flower reproduction diagrams.',
  },
  {
    id: 'd5-b5', dayNumber: 5, dateISO: '2026-11-25', startTime: '20:00', endTime: '21:45', durationMinutes: 105,
    slotLabel: 'Night PYQ & Recall', subjectId: 'sst',
    title: 'Geography Part 2: Minerals & Manufacturing Industries',
    chaptersCovered: ['Minerals & Energy Resources', 'Manufacturing Industries'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Iron/steel, cotton textile & software park map markers + pollution control.',
  },

  // DAY 6 — Nov 26
  {
    id: 'd6-b1', dayNumber: 6, dateISO: '2026-11-26', startTime: '06:00', endTime: '08:30', durationMinutes: 150,
    slotLabel: 'Morning Deep Focus', subjectId: 'maths',
    title: 'Statistics & Probability Full NCERT + Competency',
    chaptersCovered: ['Statistics (Mean, Median, Mode)', 'Probability'],
    resources: ['NCERT Textbook', 'Competency Workbook', '10-Yr Solved Papers'],
    deliverable: 'Master missing-frequency median sums + cards/dice probability.',
  },
  {
    id: 'd6-b2', dayNumber: 6, dateISO: '2026-11-26', startTime: '09:30', endTime: '11:30', durationMinutes: 120,
    slotLabel: 'Mid-Morning Practice', subjectId: 'sst',
    title: 'Economics Complete: Development to Globalisation',
    chaptersCovered: ['Development', 'Sectors of Indian Economy', 'Money & Credit', 'Globalisation'],
    resources: ['NCERT Textbook', 'Competency Workbook', '10-Yr Solved Papers'],
    deliverable: 'SHGs, formal vs informal credit, MGNREGA, and WTO/MNC case questions.',
  },
  {
    id: 'd6-b3', dayNumber: 6, dateISO: '2026-11-26', startTime: '13:30', endTime: '15:30', durationMinutes: 120,
    slotLabel: 'Afternoon Core', subjectId: 'science',
    title: 'Heredity, Our Environment & Competency Drill',
    chaptersCovered: ['Heredity', 'Our Environment'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Mendel monohybrid/dihybrid Punnett crosses + 10% energy law numericals.',
  },
  {
    id: 'd6-b4', dayNumber: 6, dateISO: '2026-11-26', startTime: '16:30', endTime: '18:30', durationMinutes: 120,
    slotLabel: 'Evening Languages & AI', subjectId: 'english',
    title: 'English Communicative: All 5 Poems + Main Course Book',
    chaptersCovered: ['Frog & Nightingale', 'Not Marble', 'Ozymandias', 'Rime of the Ancient Mariner', 'Snake'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Poetic devices sheet + MCB thematic writing prompts.',
  },
  {
    id: 'd6-b5', dayNumber: 6, dateISO: '2026-11-26', startTime: '20:00', endTime: '21:45', durationMinutes: 105,
    slotLabel: 'Night PYQ & Recall', subjectId: 'ai',
    title: 'AI Evaluation: Confusion Matrix & Numerical Practice',
    chaptersCovered: ['Model Evaluation (TP/TN/FP/FN, Precision, Recall, F1)'],
    resources: ['Online Notes & PYQs', 'Offline Sample Paper'],
    deliverable: 'Solve 12 Confusion Matrix problems & memorize high-FP vs high-FN cases.',
  },

  // DAY 7 — Nov 27 (100% SYLLABUS COMPLETION MILESTONE!)
  {
    id: 'd7-b1', dayNumber: 7, dateISO: '2026-11-27', startTime: '06:00', endTime: '08:30', durationMinutes: 150,
    slotLabel: 'Morning Deep Focus', subjectId: 'english',
    title: 'English Communicative Drama, Grammar & Writing Formats',
    chaptersCovered: ['The Dear Departed', 'Julius Caesar', 'Email, Formal Letter, Article, Factual Desc.'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers', 'Offline Sample Paper'],
    deliverable: 'Draft 1 specimen of every writing format + Julius Caesar speech analysis.',
  },
  {
    id: 'd7-b2', dayNumber: 7, dateISO: '2026-11-27', startTime: '09:30', endTime: '11:30', durationMinutes: 120,
    slotLabel: 'Mid-Morning Practice', subjectId: 'hindi',
    title: 'Hindi Kritika Part 2 + Vyakaran & Lekhan Formats',
    chaptersCovered: ['Mata ka Anchal', 'Sana-Sana Hath Jodi', 'Main Kyon Likhta Hoon', 'Vyakaran & Lekhan'],
    resources: ['NCERT Textbook', '10-Yr Solved Papers'],
    deliverable: 'Complete Vyakaran 4-topic drill + practice Anuchhed, Patr, Vigyapan, Email.',
  },
  {
    id: 'd7-b3', dayNumber: 7, dateISO: '2026-11-27', startTime: '13:30', endTime: '15:30', durationMinutes: 120,
    slotLabel: 'Afternoon Core', subjectId: 'punjabi',
    title: 'Punjabi Vangi Ikangi + Vyakaran & Rachnatmak Lekhan',
    chaptersCovered: ['Vangi Ikangi (Plays)', 'Samasi, Bahu-Arthak, Kirya Visheshan, Muhavare', 'Lekh & Patr'],
    resources: ['Online Notes & PYQs', '10-Yr Solved Papers'],
    deliverable: 'Memorize 40 frequent Muhavare + practice formal/informal Patr format.',
  },
  {
    id: 'd7-b4', dayNumber: 7, dateISO: '2026-11-27', startTime: '16:30', endTime: '18:30', durationMinutes: 120,
    slotLabel: 'Evening Languages & AI', subjectId: 'sst',
    title: 'Complete CBSE SST Map Work & Competency Case Studies',
    chaptersCovered: ['All History & Geography Board Map Items', 'SST Competency Cases'],
    resources: ['Competency Workbook', '10-Yr Solved Papers', 'Reference Video'],
    deliverable: 'Mark 2 blank India outline maps cleanly with 100% accuracy.',
    linkedVideoId: 'vid-4',
  },
  {
    id: 'd7-b5', dayNumber: 7, dateISO: '2026-11-27', startTime: '20:00', endTime: '21:45', durationMinutes: 105,
    slotLabel: 'Night PYQ & Recall', subjectId: 'maths',
    title: 'Maths All-Chapter Competency Case-Study Marathon',
    chaptersCovered: ['Cross-Chapter Case Studies & Assertion-Reason'],
    resources: ['Competency Workbook'],
    deliverable: 'Solve 10 case-study sets across Algebra, Geometry, Trig & Mensuration.',
  },

  // DAY 8 — Nov 28 (MOCK SPRINT 1: MATHS + SCIENCE)
  {
    id: 'd8-b1', dayNumber: 8, dateISO: '2026-11-28', startTime: '06:00', endTime: '09:00', durationMinutes: 180,
    slotLabel: 'Morning Deep Focus', subjectId: 'maths',
    title: 'Full Timed 3-Hour Maths Offline Sample Paper #1',
    chaptersCovered: ['Full Mathematics Syllabus (80 Marks)'],
    resources: ['Offline Sample Paper'],
    deliverable: 'Write under strict exam timer (no phone/notes), then self-grade honestly.',
  },
  {
    id: 'd8-b2', dayNumber: 8, dateISO: '2026-11-28', startTime: '10:00', endTime: '11:30', durationMinutes: 90,
    slotLabel: 'Mid-Morning Practice', subjectId: 'maths',
    title: 'Maths Paper Error Analysis + 10-Yr Tough PYQs',
    chaptersCovered: ['Weak Chapters Identified from Mock #1'],
    resources: ['10-Yr Solved Papers', 'Competency Workbook'],
    deliverable: 'Re-solve every wrong/skipped question twice in a dedicated mistake notebook.',
  },
  {
    id: 'd8-b3', dayNumber: 8, dateISO: '2026-11-28', startTime: '13:30', endTime: '16:30', durationMinutes: 180,
    slotLabel: 'Afternoon Core', subjectId: 'science',
    title: 'Full Timed 3-Hour Science Offline Sample Paper #1',
    chaptersCovered: ['Full Science Syllabus (80 Marks)'],
    resources: ['Offline Sample Paper'],
    deliverable: 'Complete Physics, Chemistry & Biology sections with neat labelled diagrams.',
  },
  {
    id: 'd8-b4', dayNumber: 8, dateISO: '2026-11-28', startTime: '17:30', endTime: '18:45', durationMinutes: 75,
    slotLabel: 'Evening Languages & AI', subjectId: 'science',
    title: 'Science Mock Evaluation & NCERT Keyword Audit',
    chaptersCovered: ['Science Mistake Log & Chemical Equations'],
    resources: ['10-Yr Solved Papers', 'NCERT Textbook'],
    deliverable: 'Highlight missing NCERT keywords and fix numerical unit errors.',
  },
  {
    id: 'd8-b5', dayNumber: 8, dateISO: '2026-11-28', startTime: '20:00', endTime: '21:30', durationMinutes: 90,
    slotLabel: 'Night PYQ & Recall', subjectId: 'ai',
    title: 'AI Sample Paper Timed Practice (2 Hours Condensed)',
    chaptersCovered: ['Full AI Code 417 Syllabus (50 Marks)'],
    resources: ['Online Notes & PYQs', 'Offline Sample Paper'],
    deliverable: 'Score 45+/50 on CBSE AI sample paper and review missed definitions.',
  },

  // DAY 9 — Nov 29 (MOCK SPRINT 2: SST + ENGLISH + HINDI)
  {
    id: 'd9-b1', dayNumber: 9, dateISO: '2026-11-29', startTime: '06:00', endTime: '09:00', durationMinutes: 180,
    slotLabel: 'Morning Deep Focus', subjectId: 'sst',
    title: 'Full Timed 3-Hour SST Offline Sample Paper #1',
    chaptersCovered: ['Full SST Syllabus + Map Work (80 Marks)'],
    resources: ['Offline Sample Paper', 'Reference Video'],
    deliverable: 'Write crisp bullet-point 3 & 5-mark answers with underlined keywords.',
    linkedVideoId: 'vid-5',
  },
  {
    id: 'd9-b2', dayNumber: 9, dateISO: '2026-11-29', startTime: '10:00', endTime: '11:30', durationMinutes: 90,
    slotLabel: 'Mid-Morning Practice', subjectId: 'sst',
    title: 'SST Error Fix + 10-Yr High-Repeat Questions',
    chaptersCovered: ['History, Civics, Geography, Economics PYQs'],
    resources: ['10-Yr Solved Papers'],
    deliverable: 'Review top 25 most-repeated board questions across the last 10 years.',
  },
  {
    id: 'd9-b3', dayNumber: 9, dateISO: '2026-11-29', startTime: '13:30', endTime: '16:30', durationMinutes: 180,
    slotLabel: 'Afternoon Core', subjectId: 'english',
    title: 'Full Timed 3-Hour English Communicative Sample Paper',
    chaptersCovered: ['Reading, Writing, Grammar & Literature (80 Marks)'],
    resources: ['Offline Sample Paper', '10-Yr Solved Papers'],
    deliverable: 'Stick strictly to word limits and verify every email/letter format.',
  },
  {
    id: 'd9-b4', dayNumber: 9, dateISO: '2026-11-29', startTime: '17:30', endTime: '19:15', durationMinutes: 105,
    slotLabel: 'Evening Languages & AI', subjectId: 'hindi',
    title: 'Hindi Course A Timed Section Drill & Sample Paper',
    chaptersCovered: ['Apathit, Vyakaran, Kshitij, Kritika & Lekhan'],
    resources: ['Offline Sample Paper', '10-Yr Solved Papers'],
    deliverable: 'Check spelling accuracy (Matra check) and complete 1 full paper review.',
  },
  {
    id: 'd9-b5', dayNumber: 9, dateISO: '2026-11-29', startTime: '20:15', endTime: '21:45', durationMinutes: 90,
    slotLabel: 'Night PYQ & Recall', subjectId: 'punjabi',
    title: 'Punjabi Previous-Year Paper Timed Drill',
    chaptersCovered: ['Unseen Passage, Vyakaran, Sahit Mala, Vangi & Writing'],
    resources: ['Online Notes & PYQs', '10-Yr Solved Papers'],
    deliverable: 'Write 1 Lekh + 1 Patr + solve Vyakaran section accurately.',
  },

  // DAY 10 — Nov 30 (FINAL PRE-BOARD CONSOLIDATION & FORMULA LOCK-IN)
  {
    id: 'd10-b1', dayNumber: 10, dateISO: '2026-11-30', startTime: '06:00', endTime: '08:30', durationMinutes: 150,
    slotLabel: 'Morning Deep Focus', subjectId: 'maths',
    title: 'Maths Second Mock (Weak Sections) + Master Formula Sheet',
    chaptersCovered: ['All 14 Chapters Formulas, Theorems & Tough PYQs'],
    resources: ['Offline Sample Paper', '10-Yr Solved Papers'],
    deliverable: 'Final 2-page Maths cheat sheet memorized cold.',
  },
  {
    id: 'd10-b2', dayNumber: 10, dateISO: '2026-11-30', startTime: '09:30', endTime: '11:30', durationMinutes: 120,
    slotLabel: 'Mid-Morning Practice', subjectId: 'science',
    title: 'Science Rapid Recall: Equations, Formulas & Diagrams',
    chaptersCovered: ['Physics Formulas, Chemical Reactions, Biology Diagrams'],
    resources: ['NCERT Textbook', 'Competency Workbook'],
    deliverable: 'Verify all 30+ key reactions, lens/circuit formulas, and bio diagrams.',
  },
  {
    id: 'd10-b3', dayNumber: 10, dateISO: '2026-11-30', startTime: '13:30', endTime: '15:30', durationMinutes: 120,
    slotLabel: 'Afternoon Core', subjectId: 'sst',
    title: 'SST Rapid Dates, Definitions & Final Map Verification',
    chaptersCovered: ['All 4 SST Books + Complete Board Map Syllabus'],
    resources: ['10-Yr Solved Papers', 'NCERT Textbook'],
    deliverable: '100% map recall drill + review mistake log.',
  },
  {
    id: 'd10-b4', dayNumber: 10, dateISO: '2026-11-30', startTime: '16:30', endTime: '18:30', durationMinutes: 120,
    slotLabel: 'Evening Languages & AI', subjectId: 'english',
    title: 'Languages Triple Polish: English Comm., Hindi A & Punjabi',
    chaptersCovered: ['Writing Formats, Literary Quotes, Vyakaran & Muhavare'],
    resources: ['10-Yr Solved Papers', 'Online Notes & PYQs'],
    deliverable: 'Review all 3 language format checklists and author/poet name tables.',
  },
  {
    id: 'd10-b5', dayNumber: 10, dateISO: '2026-11-30', startTime: '20:00', endTime: '21:30', durationMinutes: 90,
    slotLabel: 'Night PYQ & Recall', subjectId: 'ai',
    title: 'AI Final Revision + December Pre-Board Readiness Checklist',
    chaptersCovered: ['AI Formulas + Overall Mistake Notebook Review'],
    resources: ['Online Notes & PYQs', 'Offline Sample Paper'],
    deliverable: 'Light calm recall, pack exam kit, sleep early for December Pre-Boards!',
  },
];
