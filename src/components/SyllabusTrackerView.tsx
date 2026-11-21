import React, { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { SUBJECTS, type SubjectId } from '../data/syllabusData';
import { computeSubjectProgress } from '../utils/scheduleEngine';

interface SyllabusTrackerViewProps {
  completedBlockIds: Set<string>;
  completedChapterIds: Set<string>;
  onToggleChapter: (chapterId: string) => void;
  onDrillChapter: (subjectName: string, chapterTitle: string) => void;
}

export function SyllabusTrackerView({
  completedBlockIds,
  completedChapterIds,
  onToggleChapter,
  onDrillChapter,
}: SyllabusTrackerViewProps) {
  const [activeSubject, setActiveSubject] = useState<SubjectId | 'all'>('all');

  const progressList = useMemo(
    () => computeSubjectProgress(completedBlockIds, completedChapterIds),
    [completedBlockIds, completedChapterIds]
  );

  const visibleSubjects = useMemo(
    () => (activeSubject === 'all' ? SUBJECTS : SUBJECTS.filter((s) => s.id === activeSubject)),
    [activeSubject]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#7E22CE]">
            CBSE Class 10th Complete Curriculum · 42 Units Across 7 Subjects
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#221329] mt-1 tracking-tight">
            Chapter-by-Chapter Syllabus Mastery
          </h1>
          <p className="text-sm text-[#614B69] mt-1.5 max-w-2xl">
            Check off each chapter group after completing NCERT exercises, competency questions, or
            10-year PYQs. Progress automatically informs your Gemini Study Strategist.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubject('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubject === 'all'
                ? 'bg-[#2A1438] text-white shadow-xs'
                : 'bg-[#F6ECF3] text-[#614B69] hover:text-[#221329] hover:bg-[#EFE1EC]'
            }`}
          >
            All 7 Subjects
          </button>
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSubject(s.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubject === s.id
                  ? 'bg-[#2A1438] text-white shadow-xs'
                  : 'bg-[#F6ECF3] text-[#614B69] hover:text-[#221329] hover:bg-[#EFE1EC]'
              }`}
            >
              {s.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {visibleSubjects.map((subject) => {
          const stats = progressList.find((p) => p.subjectId === subject.id);
          const doneChapters = subject.chapters.filter((ch) => completedChapterIds.has(ch.id)).length;
          const pct = Math.round((doneChapters / subject.chapters.length) * 100);

          return (
            <section
              key={subject.id}
              className="enchanted-card rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#FBF6F9]/90 border-b border-[#E8D7E4] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#614B69]">
                    <span className="font-mono font-medium text-[#7E22CE]">{subject.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>Resources: {subject.resources.join(' · ')}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#221329] mt-0.5">
                    {subject.name}
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-[#221329] tabular-nums">
                      {doneChapters}/{subject.chapters.length} units ({pct}%)
                    </div>
                    <div className="text-xs text-[#614B69] tabular-nums">
                      {stats ? `${stats.completedBlocks}/${stats.totalBlocks} schedule blocks done` : ''}
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-[#EFE3EC] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: subject.accentHex }}
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#E8D7E4]">
                {subject.chapters.map((ch) => {
                  const checked = completedChapterIds.has(ch.id);
                  return (
                    <div
                      key={ch.id}
                      className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FBF6F9]/80 transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={`Mark chapter "${ch.title}" as ${checked ? 'incomplete' : 'completed'}`}
                          onClick={() => onToggleChapter(ch.id)}
                          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                            checked
                              ? 'bg-[#047857] border-[#047857] text-white'
                              : 'bg-white border-[#D3BDD0] text-transparent hover:border-[#6D28D9]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-medium ${
                              checked ? 'line-through text-[#614B69]' : 'text-[#221329]'
                            }`}
                          >
                            {ch.title}
                          </div>
                          <div className="text-xs text-[#614B69] mt-0.5">
                            {ch.unit} · Weightage: {ch.weightage} · Primary: {ch.primaryResource}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDrillChapter(subject.name, ch.title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#221329] bg-white hover:bg-[#F6ECF3] hover:border-[#D4B8D0] transition-colors whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#7E22CE]" />
                        Flash Drill
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
