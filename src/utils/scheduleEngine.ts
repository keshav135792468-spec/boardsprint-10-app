import {
  SCHEDULE_DAYS,
  STUDY_BLOCKS,
  SUBJECTS,
  type ResourceType,
  type StudyBlock,
  type SubjectId,
} from '../data/syllabusData';

export interface SubjectProgress {
  subjectId: SubjectId;
  name: string;
  shortName: string;
  completedBlocks: number;
  totalBlocks: number;
  completedChapters: number;
  totalChapters: number;
  percent: number;
  totalMinutes: number;
  completedMinutes: number;
}

export interface OverallProgress {
  completedBlocks: number;
  totalBlocks: number;
  blockPercent: number;
  completedChapters: number;
  totalChapters: number;
  chapterPercent: number;
  totalStudyHours: number;
  completedStudyHours: number;
  remainingDays: number;
}

export function computeOverallProgress(
  completedBlockIds: ReadonlySet<string>,
  completedChapterIds: ReadonlySet<string>,
  blocks: readonly StudyBlock[] = STUDY_BLOCKS
): OverallProgress {
  const totalBlocks = blocks.length;
  let completedBlocks = 0;
  let totalMinutes = 0;
  let completedMinutes = 0;

  for (const block of blocks) {
    totalMinutes += block.durationMinutes;
    if (completedBlockIds.has(block.id)) {
      completedBlocks += 1;
      completedMinutes += block.durationMinutes;
    }
  }

  let totalChapters = 0;
  let completedChapters = 0;
  for (const subj of SUBJECTS) {
    for (const ch of subj.chapters) {
      totalChapters += 1;
      if (completedChapterIds.has(ch.id)) {
        completedChapters += 1;
      }
    }
  }

  const daysWithIncomplete = new Set<number>();
  for (const block of blocks) {
    if (!completedBlockIds.has(block.id)) {
      daysWithIncomplete.add(block.dayNumber);
    }
  }

  return {
    completedBlocks,
    totalBlocks,
    blockPercent: totalBlocks === 0 ? 0 : Math.round((completedBlocks / totalBlocks) * 100),
    completedChapters,
    totalChapters,
    chapterPercent: totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100),
    totalStudyHours: Math.round((totalMinutes / 60) * 10) / 10,
    completedStudyHours: Math.round((completedMinutes / 60) * 10) / 10,
    remainingDays: daysWithIncomplete.size,
  };
}

export function computeSubjectProgress(
  completedBlockIds: ReadonlySet<string>,
  completedChapterIds: ReadonlySet<string>,
  blocks: readonly StudyBlock[] = STUDY_BLOCKS
): SubjectProgress[] {
  return SUBJECTS.map((subj) => {
    const subjBlocks = blocks.filter((b) => b.subjectId === subj.id);
    const totalBlocks = subjBlocks.length;
    const completedBlocks = subjBlocks.filter((b) => completedBlockIds.has(b.id)).length;
    const totalMinutes = subjBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const completedMinutes = subjBlocks
      .filter((b) => completedBlockIds.has(b.id))
      .reduce((acc, b) => acc + b.durationMinutes, 0);

    const totalChapters = subj.chapters.length;
    const completedChapters = subj.chapters.filter((ch) => completedChapterIds.has(ch.id)).length;

    const totalUnits = totalBlocks + totalChapters;
    const doneUnits = completedBlocks + completedChapters;
    const percent = totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100);

    return {
      subjectId: subj.id,
      name: subj.name,
      shortName: subj.shortName,
      completedBlocks,
      totalBlocks,
      completedChapters,
      totalChapters,
      percent,
      totalMinutes,
      completedMinutes,
    };
  });
}

export function filterStudyBlocks(
  blocks: readonly StudyBlock[],
  options: {
    dayNumber?: number | 'all';
    subjectId?: SubjectId | 'all';
    resource?: ResourceType | 'all';
    searchQuery?: string;
    hideCompleted?: boolean;
    completedBlockIds?: ReadonlySet<string>;
  }
): StudyBlock[] {
  const query = (options.searchQuery || '').trim().toLowerCase();

  return blocks.filter((block) => {
    if (options.dayNumber && options.dayNumber !== 'all' && block.dayNumber !== options.dayNumber) {
      return false;
    }
    if (options.subjectId && options.subjectId !== 'all' && block.subjectId !== options.subjectId) {
      return false;
    }
    if (options.resource && options.resource !== 'all' && !block.resources.includes(options.resource)) {
      return false;
    }
    if (options.hideCompleted && options.completedBlockIds?.has(block.id)) {
      return false;
    }
    if (query) {
      const haystack = [
        block.title,
        block.deliverable,
        block.slotLabel,
        ...block.chaptersCovered,
        ...block.resources,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

export function buildCalendarEventPayload(block: StudyBlock, timeZone = 'Asia/Kolkata') {
  const subject = SUBJECTS.find((s) => s.id === block.subjectId);
  const startDateTime = `${block.dateISO}T${block.startTime}:00`;
  const endDateTime = `${block.dateISO}T${block.endTime}:00`;

  return {
    summary: `[Class 10 ${subject?.shortName || block.subjectId}] ${block.title}`,
    description: [
      `Phase Slot: ${block.slotLabel}`,
      `Chapters: ${block.chaptersCovered.join(', ')}`,
      `Resources: ${block.resources.join(', ')}`,
      `Goal: ${block.deliverable}`,
    ].join('\n'),
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
  };
}

export function buildGoogleSheetRows(
  completedBlockIds: ReadonlySet<string>,
  blocks: readonly StudyBlock[] = STUDY_BLOCKS
): string[][] {
  const header = [
    'Day',
    'Date',
    'Time Slot',
    'Subject',
    'Session Title',
    'Chapters Covered',
    'Resources',
    'Deliverable',
    'Status',
  ];

  const rows = blocks.map((b) => {
    const subj = SUBJECTS.find((s) => s.id === b.subjectId);
    const dayMeta = SCHEDULE_DAYS.find((d) => d.dayNumber === b.dayNumber);
    return [
      `Day ${b.dayNumber}`,
      dayMeta ? `${dayMeta.displayDate} (${dayMeta.weekday})` : b.dateISO,
      `${b.startTime}–${b.endTime}`,
      subj?.name || b.subjectId,
      b.title,
      b.chaptersCovered.join('; '),
      b.resources.join(', '),
      b.deliverable,
      completedBlockIds.has(b.id) ? 'Completed' : 'Pending',
    ];
  });

  return [header, ...rows];
}

export function buildProgressSummaryForAI(
  completedBlockIds: ReadonlySet<string>,
  completedChapterIds: ReadonlySet<string>
): string {
  const overall = computeOverallProgress(completedBlockIds, completedChapterIds);
  const perSubj = computeSubjectProgress(completedBlockIds, completedChapterIds);

  const lines = [
    `Schedule Window: Nov 21 – Nov 30, 2026 (10 days total).`,
    `Overall Schedule Blocks: ${overall.completedBlocks}/${overall.totalBlocks} (${overall.blockPercent}%), ${overall.completedStudyHours}/${overall.totalStudyHours} study hours completed.`,
    `Overall Syllabus Chapters: ${overall.completedChapters}/${overall.totalChapters} (${overall.chapterPercent}%).`,
    'Per-Subject Status:',
    ...perSubj.map(
      (s) =>
        `- ${s.name}: ${s.completedBlocks}/${s.totalBlocks} study blocks, ${s.completedChapters}/${s.totalChapters} chapters (${s.percent}%)`
    ),
  ];

  return lines.join('\n');
}

export interface SubjectChartDatum {
  subjectId: SubjectId;
  name: string;
  shortName: string;
  accentHex: string;
  completedBlocks: number;
  pendingBlocks: number;
  totalBlocks: number;
  completedChapters: number;
  pendingChapters: number;
  totalChapters: number;
  completedUnits: number;
  pendingUnits: number;
  totalUnits: number;
  completedHours: number;
  pendingHours: number;
  totalHours: number;
  completionPercent: number;
}

export function buildSubjectChartData(
  completedBlockIds: ReadonlySet<string>,
  completedChapterIds: ReadonlySet<string>,
  blocks: readonly StudyBlock[] = STUDY_BLOCKS
): SubjectChartDatum[] {
  const progress = computeSubjectProgress(completedBlockIds, completedChapterIds, blocks);
  const accentMap = new Map(SUBJECTS.map((s) => [s.id, s.accentHex]));

  return progress.map((sp) => {
    const pendingBlocks = Math.max(0, sp.totalBlocks - sp.completedBlocks);
    const pendingChapters = Math.max(0, sp.totalChapters - sp.completedChapters);
    const completedUnits = sp.completedBlocks + sp.completedChapters;
    const totalUnits = sp.totalBlocks + sp.totalChapters;
    const pendingUnits = Math.max(0, totalUnits - completedUnits);
    const completedHours = Math.round((sp.completedMinutes / 60) * 10) / 10;
    const totalHours = Math.round((sp.totalMinutes / 60) * 10) / 10;
    const pendingHours = Math.max(0, Math.round((totalHours - completedHours) * 10) / 10);

    return {
      subjectId: sp.subjectId,
      name: sp.name,
      shortName: sp.shortName,
      accentHex: accentMap.get(sp.subjectId) || '#1D4ED8',
      completedBlocks: sp.completedBlocks,
      pendingBlocks,
      totalBlocks: sp.totalBlocks,
      completedChapters: sp.completedChapters,
      pendingChapters,
      totalChapters: sp.totalChapters,
      completedUnits,
      pendingUnits,
      totalUnits,
      completedHours,
      pendingHours,
      totalHours,
      completionPercent: sp.percent,
    };
  });
}

