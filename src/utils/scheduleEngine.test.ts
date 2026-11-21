import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEDULE_DAYS, STUDY_BLOCKS, SUBJECTS, REFERENCE_VIDEOS } from '../data/syllabusData';
import {
  buildCalendarEventPayload,
  buildGoogleSheetRows,
  buildProgressSummaryForAI,
  buildSubjectChartData,
  computeOverallProgress,
  computeSubjectProgress,
  filterStudyBlocks,
} from './scheduleEngine';

test('schedule covers all 10 days from Nov 21 to Nov 30, 2026', () => {
  assert.equal(SCHEDULE_DAYS.length, 10);
  assert.equal(SCHEDULE_DAYS[0].dateISO, '2026-11-21');
  assert.equal(SCHEDULE_DAYS[9].dateISO, '2026-11-30');
  assert.equal(STUDY_BLOCKS.length, 50);
  for (let d = 1; d <= 10; d += 1) {
    const dayBlocks = STUDY_BLOCKS.filter((b) => b.dayNumber === d);
    assert.equal(dayBlocks.length, 5, `Day ${d} should have 5 study blocks`);
  }
});

test('all 7 requested Class 10 subjects and all 5 YouTube reference videos are present', () => {
  const ids = new Set(SUBJECTS.map((s) => s.id));
  for (const required of ['maths', 'science', 'sst', 'english', 'hindi', 'ai', 'punjabi'] as const) {
    assert.ok(ids.has(required), `Missing subject: ${required}`);
    const blockCount = STUDY_BLOCKS.filter((b) => b.subjectId === required).length;
    assert.ok(blockCount >= 4, `Subject ${required} should have at least 4 scheduled blocks`);
  }
  assert.equal(REFERENCE_VIDEOS.length, 5);
  const ytIds = REFERENCE_VIDEOS.map((v) => v.youtubeId);
  assert.deepEqual(ytIds, ['VoQRpE1P7A4', '7Q-PwzYiQsU', 'o0aOTJeMxso', 'hvkRXvgWToQ', 'Y0iw4eyNauY']);
});

test('computeOverallProgress and computeSubjectProgress calculate accurate completion metrics', () => {
  const empty = computeOverallProgress(new Set(), new Set());
  assert.equal(empty.completedBlocks, 0);
  assert.equal(empty.blockPercent, 0);
  assert.equal(empty.remainingDays, 10);

  const doneBlocks = new Set(STUDY_BLOCKS.slice(0, 5).map((b) => b.id)); // All of Day 1
  const doneChapters = new Set(['m1', 's1']);
  const partial = computeOverallProgress(doneBlocks, doneChapters);
  assert.equal(partial.completedBlocks, 5);
  assert.equal(partial.blockPercent, 10);
  assert.equal(partial.completedChapters, 2);
  assert.equal(partial.remainingDays, 9);

  const perSubject = computeSubjectProgress(doneBlocks, doneChapters);
  const maths = perSubject.find((s) => s.subjectId === 'maths');
  assert.ok(maths);
  assert.equal(maths.completedBlocks, 1);
  assert.equal(maths.completedChapters, 1);
});

test('filterStudyBlocks filters by day, subject, resource, search query, and hideCompleted', () => {
  const scienceDay1 = filterStudyBlocks(STUDY_BLOCKS, { dayNumber: 1, subjectId: 'science' });
  assert.equal(scienceDay1.length, 1);
  assert.equal(scienceDay1[0].id, 'd1-b2');

  const punjabiBlocks = filterStudyBlocks(STUDY_BLOCKS, { subjectId: 'punjabi' });
  assert.ok(punjabiBlocks.length >= 4);

  const competencyScience = filterStudyBlocks(STUDY_BLOCKS, {
    subjectId: 'science',
    resource: 'Competency Workbook',
  });
  assert.ok(competencyScience.length >= 4);

  const searchJulius = filterStudyBlocks(STUDY_BLOCKS, { searchQuery: 'Julius Caesar' });
  assert.equal(searchJulius.length, 1);
  assert.equal(searchJulius[0].subjectId, 'english');

  const hidden = filterStudyBlocks(STUDY_BLOCKS, {
    dayNumber: 1,
    hideCompleted: true,
    completedBlockIds: new Set(['d1-b1', 'd1-b2']),
  });
  assert.equal(hidden.length, 3);
});

test('buildCalendarEventPayload, buildGoogleSheetRows, and AI summary generate valid structures', () => {
  const payload = buildCalendarEventPayload(STUDY_BLOCKS[0]);
  assert.equal(payload.start.dateTime, '2026-11-21T06:00:00');
  assert.equal(payload.end.dateTime, '2026-11-21T08:30:00');
  assert.ok(payload.summary.includes('Maths'));

  const rows = buildGoogleSheetRows(new Set(['d1-b1']));
  assert.equal(rows.length, 51); // 1 header + 50 rows
  assert.equal(rows[1][8], 'Completed');
  assert.equal(rows[2][8], 'Pending');

  const summary = buildProgressSummaryForAI(new Set(['d1-b1']), new Set(['m1']));
  assert.ok(summary.includes('Nov 21 – Nov 30, 2026'));
  assert.ok(summary.includes('English Communicative'));
});

test('buildSubjectChartData computes per-subject completed/pending blocks, chapters, units, and hours', () => {
  const emptyChart = buildSubjectChartData(new Set(), new Set());
  assert.equal(emptyChart.length, 7);
  for (const row of emptyChart) {
    assert.equal(row.completedBlocks, 0);
    assert.equal(row.completedChapters, 0);
    assert.equal(row.completedUnits, 0);
    assert.equal(row.completedHours, 0);
    assert.equal(row.pendingBlocks, row.totalBlocks);
    assert.equal(row.pendingChapters, row.totalChapters);
    assert.equal(row.pendingUnits, row.totalUnits);
    assert.equal(row.completionPercent, 0);
  }

  // Partial completion: Day 1 Maths block (d1-b1, 150 min = 2.5h) + Maths chapter m1
  const partialChart = buildSubjectChartData(new Set(['d1-b1']), new Set(['m1']));
  const maths = partialChart.find((d) => d.subjectId === 'maths');
  assert.ok(maths);
  assert.equal(maths.completedBlocks, 1);
  assert.equal(maths.pendingBlocks, maths.totalBlocks - 1);
  assert.equal(maths.completedChapters, 1);
  assert.equal(maths.pendingChapters, maths.totalChapters - 1);
  assert.equal(maths.completedUnits, 2);
  assert.equal(maths.pendingUnits, maths.totalUnits - 2);
  assert.equal(maths.completedHours, 2.5);
  assert.equal(maths.pendingHours, Math.round((maths.totalHours - 2.5) * 10) / 10);
  assert.ok(maths.completionPercent > 0 && maths.completionPercent < 100);

  // Full completion for Punjabi subject
  const punjabiSubject = SUBJECTS.find((s) => s.id === 'punjabi');
  assert.ok(punjabiSubject);
  const allPunjabiBlocks = new Set(
    STUDY_BLOCKS.filter((b) => b.subjectId === 'punjabi').map((b) => b.id)
  );
  const allPunjabiChapters = new Set(punjabiSubject.chapters.map((c) => c.id));
  const fullChart = buildSubjectChartData(allPunjabiBlocks, allPunjabiChapters);
  const punjabi = fullChart.find((d) => d.subjectId === 'punjabi');
  assert.ok(punjabi);
  assert.equal(punjabi.pendingBlocks, 0);
  assert.equal(punjabi.pendingChapters, 0);
  assert.equal(punjabi.pendingUnits, 0);
  assert.equal(punjabi.pendingHours, 0);
  assert.equal(punjabi.completionPercent, 100);
});

