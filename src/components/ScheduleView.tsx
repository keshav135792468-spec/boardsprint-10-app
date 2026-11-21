import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Video,
} from 'lucide-react';
import {
  REFERENCE_VIDEOS,
  SCHEDULE_DAYS,
  STUDY_BLOCKS,
  SUBJECTS,
  type ResourceType,
  type StudyBlock,
  type SubjectId,
} from '../data/syllabusData';
import {
  computeOverallProgress,
  computeSubjectProgress,
  filterStudyBlocks,
} from '../utils/scheduleEngine';

const HERO_IMAGE_PATH = '/src/assets/images/floral_magic_study_hero_1795289199306.jpg';

const RESOURCES_LIST: ResourceType[] = [
  'NCERT Textbook',
  'Competency Workbook',
  '10-Yr Solved Papers',
  'Offline Sample Paper',
  'Online Notes & PYQs',
  'Reference Video',
];

interface ScheduleViewProps {
  completedBlockIds: Set<string>;
  completedChapterIds: Set<string>;
  onToggleBlock: (blockId: string) => void;
  onAskAIAboutBlock: (block: StudyBlock) => void;
  onOpenVideo: (videoId: string) => void;
  onNavigateToWorkspace: () => void;
}

export function ScheduleView({
  completedBlockIds,
  completedChapterIds,
  onToggleBlock,
  onAskAIAboutBlock,
  onOpenVideo,
  onNavigateToWorkspace,
}: ScheduleViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>(1);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [selectedResource, setSelectedResource] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Built-in Pomodoro Focus Timer (25m / 50m / 10m break)
  const [timerPresetMin, setTimerPresetMin] = useState<25 | 50 | 10>(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const handleSelectPreset = (minutes: 25 | 50 | 10) => {
    setTimerRunning(false);
    setTimerPresetMin(minutes);
    setSecondsLeft(minutes * 60);
  };

  const formattedTimer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

  const overall = useMemo(
    () => computeOverallProgress(completedBlockIds, completedChapterIds),
    [completedBlockIds, completedChapterIds]
  );

  const subjectProgress = useMemo(
    () => computeSubjectProgress(completedBlockIds, completedChapterIds),
    [completedBlockIds, completedChapterIds]
  );

  const filteredBlocks = useMemo(
    () =>
      filterStudyBlocks(STUDY_BLOCKS, {
        dayNumber: selectedDay,
        subjectId: selectedSubject,
        resource: selectedResource,
        searchQuery,
        hideCompleted,
        completedBlockIds,
      }),
    [selectedDay, selectedSubject, selectedResource, searchQuery, hideCompleted, completedBlockIds]
  );

  const currentDayMeta =
    selectedDay === 'all' ? null : SCHEDULE_DAYS.find((d) => d.dayNumber === selectedDay) || null;

  const subjectMap = useMemo(() => new Map(SUBJECTS.map((s) => [s.id, s])), []);
  const videoMap = useMemo(() => new Map(REFERENCE_VIDEOS.map((v) => [v.id, v])), []);

  return (
    <div className="space-y-10">
      {/* 2-Column Enchanted Botanical Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between enchanted-card rounded-xl p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-[#7E22CE]">
              Nov 21 – Nov 30, 2026 · 10-Day CBSE Class 10 Pre-Board Sprint · All 7 Subjects
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#221329] text-balance leading-[1.08]">
              Finish your entire Class 10th syllabus before December pre-boards.
            </h1>
            <p className="text-[15px] leading-relaxed text-[#614B69] max-w-2xl">
              Structured around your exact toolkit—NCERT textbooks, Maths/Science/SST competency
              workbooks, previous 10-year solved papers, offline sample papers, and online guides
              for AI and Punjabi—plus English Communicative (Course A) and Hindi Course A.
            </p>
          </div>

          {/* Focus Timer Strip inside Hero */}
          <div className="mt-6 pt-5 border-t border-[#E8D7E4] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-[#614B69]">Study Sprint Timer</div>
                <div
                  className="font-mono text-2xl font-semibold text-[#221329] tabular-nums"
                  aria-live="off"
                >
                  {formattedTimer}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#F6ECF3] p-1 rounded-lg border border-[#E8D7E4]/70">
                {([25, 50, 10] as const).map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => handleSelectPreset(min)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      timerPresetMin === min
                        ? 'bg-white text-[#221329] shadow-xs'
                        : 'text-[#614B69] hover:text-[#221329]'
                    }`}
                  >
                    {min === 10 ? '10m Break' : `${min}m`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg enchanted-cta text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {timerRunning ? 'Pause Timer' : 'Start Focus'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(timerPresetMin * 60);
                }}
                aria-label="Reset focus timer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E8D7E4] text-[#614B69] hover:text-[#221329] hover:bg-[#F6ECF3] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-[#E8D7E4] min-h-[260px] bg-[#F3E5EE] shadow-[0_12px_32px_-14px_rgba(91,33,182,0.22)]">
          {!heroImgFailed ? (
            <img
              src={HERO_IMAGE_PATH}
              alt="Enchanted glasshouse study sanctuary with open notebook, brass compass, blooming peonies, violet wisteria, and glowing golden runes"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#F6ECF3] via-[#EDE0F6] to-[#FCE7F3]">
              <Clock className="w-8 h-8 text-[#6D28D9] mb-2" />
              <p className="font-display text-2xl font-bold text-[#221329]">
                BoardSprint 10 Sanctuary
              </p>
              <p className="text-xs text-[#614B69] mt-1">Nov 21 – Nov 30, 2026</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A0D24]/88 via-[#1A0D24]/50 to-transparent p-5 text-white">
            <div className="text-xs text-[#FDE68A]">Sprint Architecture</div>
            <div className="text-sm font-medium mt-0.5">
              Days 1–7: Complete 100% Syllabus · Days 8–10: Timed Offline Sample Papers &amp; PYQ
              Fix
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column KPI Row Below Hero */}
      <section
        aria-label="Pre-board progress overview"
        className="grid grid-cols-2 lg:grid-cols-4 enchanted-card rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-[#E8D7E4]"
      >
        <div className="p-5">
          <div className="text-xs text-[#614B69]">Study Sessions Done</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-[#221329] tabular-nums">
              {overall.completedBlocks}/{overall.totalBlocks}
            </span>
            <span className="font-mono text-xs text-[#047857] tabular-nums">
              {overall.blockPercent}% complete
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs text-[#614B69]">Syllabus Units Mastered</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-[#221329] tabular-nums">
              {overall.completedChapters}/{overall.totalChapters}
            </span>
            <span className="font-mono text-xs text-[#614B69] tabular-nums">
              {overall.chapterPercent}%
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs text-[#614B69]">Focused Study Hours</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-[#221329] tabular-nums">
              {overall.completedStudyHours}h
            </span>
            <span className="font-mono text-xs text-[#614B69] tabular-nums">
              of {overall.totalStudyHours}h planned
            </span>
          </div>
        </div>
        <div className="p-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#614B69]">Active Days Left</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-[#221329] tabular-nums">
              {overall.remainingDays}{' '}
              <span className="text-xs font-sans font-normal text-[#614B69]">of 10 days</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToWorkspace}
            className="text-xs font-medium text-[#6D28D9] hover:text-[#BE185D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sync to Calendar
          </button>
        </div>
      </section>

      {/* 7-Subject Compact Progress Bar Strip */}
      <section aria-label="Progress across all 7 subjects" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[#221329]">
            Subject Readiness (7 Subjects)
          </h2>
          <span className="text-xs text-[#614B69]">Click a subject to filter schedule</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {subjectProgress.map((sp) => {
            const isSelected = selectedSubject === sp.subjectId;
            return (
              <button
                key={sp.subjectId}
                type="button"
                onClick={() =>
                  setSelectedSubject((curr) => (curr === sp.subjectId ? 'all' : sp.subjectId))
                }
                aria-pressed={isSelected}
                className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2A1438] text-white border-[#2A1438] shadow-[0_8px_20px_-8px_rgba(91,33,182,0.45)]'
                    : 'bg-white/95 text-[#221329] border-[#E8D7E4] hover:border-[#7E22CE]/50'
                }`}
              >
                <div className="text-xs font-semibold truncate">{sp.shortName}</div>
                <div
                  className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
                    isSelected ? 'text-white' : 'text-[#221329]'
                  }`}
                >
                  {sp.percent}%
                </div>
                <div
                  className={`mt-1.5 h-1.5 w-full rounded-full overflow-hidden ${
                    isSelected ? 'bg-white/20' : 'bg-[#F3E6EF]'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      isSelected ? 'bg-[#FDE68A]' : 'bg-gradient-to-r from-[#6D28D9] to-[#BE185D]'
                    }`}
                    style={{ width: `${sp.percent}%` }}
                  />
                </div>
                <div
                  className={`mt-1.5 text-[11px] tabular-nums ${
                    isSelected ? 'text-white/80' : 'text-[#614B69]'
                  }`}
                >
                  {sp.completedBlocks}/{sp.totalBlocks} sessions
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Master 10-Day Schedule Section */}
      <section aria-label="Day-by-day study schedule" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#221329]">
              Master Schedule: Nov 21 – Nov 30
            </h2>
            <p className="text-sm text-[#614B69] mt-1">
              {currentDayMeta
                ? `Day ${currentDayMeta.dayNumber} (${currentDayMeta.weekday}, ${currentDayMeta.displayDate}) · ${currentDayMeta.phase} · ${currentDayMeta.theme}`
                : 'Showing all 50 scheduled study blocks across all 10 days.'}
            </p>
          </div>

          {/* Search & Hide Completed */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#614B69] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <label htmlFor="schedule-search" className="sr-only">
                Search chapters or topics
              </label>
              <input
                id="schedule-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapter, theorem, map..."
                className="pl-9 pr-3 py-2 text-sm bg-white border border-[#E8D7E4] rounded-lg w-56 text-[#221329] focus:outline-none focus:border-[#7E22CE]"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#614B69] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="w-4 h-4 rounded border-[#E8D7E4] accent-[#6D28D9]"
              />
              Hide completed
            </label>
          </div>
        </div>

        {/* Day Strip Selector */}
        <div
          role="tablist"
          aria-label="Select schedule day"
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedDay === 'all'}
            onClick={() => setSelectedDay('all')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedDay === 'all'
                ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                : 'bg-white text-[#614B69] border-[#E8D7E4] hover:text-[#221329]'
            }`}
          >
            All 10 Days
          </button>
          {SCHEDULE_DAYS.map((day) => {
            const active = selectedDay === day.dayNumber;
            const dayBlocks = STUDY_BLOCKS.filter((b) => b.dayNumber === day.dayNumber);
            const doneCount = dayBlocks.filter((b) => completedBlockIds.has(b.id)).length;
            return (
              <button
                key={day.dayNumber}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedDay(day.dayNumber)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#2A1438] text-white border-[#2A1438]'
                    : 'bg-white text-[#221329] border-[#E8D7E4] hover:border-[#7E22CE]/50'
                }`}
              >
                <span>
                  Day {day.dayNumber} · {day.displayDate}
                </span>
                <span
                  className={`ml-1.5 font-mono text-[11px] tabular-nums ${
                    active
                      ? 'text-[#FDE68A]'
                      : doneCount === dayBlocks.length
                      ? 'text-[#047857]'
                      : 'text-[#614B69]'
                  }`}
                >
                  ({doneCount}/{dayBlocks.length})
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Resource Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#614B69] font-medium mr-1">Resource:</span>
          <button
            type="button"
            onClick={() => setSelectedResource('all')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedResource === 'all'
                ? 'bg-[#2A1438] text-white'
                : 'bg-[#F6ECF3] text-[#614B69] hover:text-[#221329]'
            }`}
          >
            All Resources
          </button>
          {RESOURCES_LIST.map((res) => (
            <button
              key={res}
              type="button"
              onClick={() => setSelectedResource((curr) => (curr === res ? 'all' : res))}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedResource === res
                  ? 'bg-[#2A1438] text-white'
                  : 'bg-[#F6ECF3] text-[#614B69] hover:text-[#221329]'
              }`}
            >
              {res}
            </button>
          ))}

          {(selectedSubject !== 'all' ||
            selectedResource !== 'all' ||
            searchQuery ||
            hideCompleted) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubject('all');
                setSelectedResource('all');
                setSearchQuery('');
                setHideCompleted(false);
              }}
              className="ml-auto text-xs font-medium text-[#6D28D9] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Study Blocks Table/List */}
        {filteredBlocks.length === 0 ? (
          <div className="enchanted-card rounded-xl p-10 text-center">
            <p className="font-display text-2xl font-bold text-[#221329]">
              No matching study sessions
            </p>
            <p className="text-sm text-[#614B69] mt-1">
              Try clearing your subject, resource, or search filter to view scheduled blocks.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDay('all');
                setSelectedSubject('all');
                setSelectedResource('all');
                setSearchQuery('');
                setHideCompleted(false);
              }}
              className="mt-4 px-4 py-2 text-xs font-medium enchanted-cta text-white rounded-lg transition-all cursor-pointer"
            >
              Show Full 10-Day Schedule
            </button>
          </div>
        ) : (
          <div className="enchanted-card rounded-xl divide-y divide-[#E8D7E4]">
            {filteredBlocks.map((block) => {
              const isDone = completedBlockIds.has(block.id);
              const subj = subjectMap.get(block.subjectId);
              const linkedVideo = block.linkedVideoId
                ? videoMap.get(block.linkedVideoId)
                : undefined;

              return (
                <div
                  key={block.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${
                    isDone ? 'bg-[#FBF6F9]/85' : 'hover:bg-[#FBF6F9]/65'
                  }`}
                >
                  {/* Completion Checkbox */}
                  <div className="flex items-center gap-3 sm:pt-0.5 shrink-0">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      aria-label={`Mark "${block.title}" as ${isDone ? 'incomplete' : 'complete'}`}
                      onClick={() => onToggleBlock(block.id)}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                        isDone
                          ? 'bg-[#047857] border-[#047857] text-white'
                          : 'bg-white border-[#CBB4C7] text-transparent hover:border-[#7E22CE]'
                      }`}
                    >
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    </button>

                    <div className="sm:w-28 shrink-0">
                      <div className="font-mono text-xs font-semibold text-[#221329] tabular-nums">
                        {block.startTime}–{block.endTime}
                      </div>
                      <div className="text-[11px] text-[#614B69] tabular-nums">
                        Day {block.dayNumber} · {block.durationMinutes} min
                      </div>
                    </div>
                  </div>

                  {/* Main Session Info (Zero-Pill Clean Metadata) */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#614B69]">
                      <span
                        className="font-semibold"
                        style={{ color: subj?.accentHex || '#6D28D9' }}
                      >
                        {subj?.name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{block.slotLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{block.resources.join(' / ')}</span>
                    </div>

                    <h3
                      className={`text-base font-semibold leading-snug ${
                        isDone ? 'line-through text-[#614B69]' : 'text-[#221329]'
                      }`}
                    >
                      {block.title}
                    </h3>

                    <p className="text-sm text-[#614B69] leading-relaxed">
                      <span className="font-medium text-[#221329]">Target:</span>{' '}
                      {block.deliverable}
                    </p>

                    <div className="text-xs text-[#614B69]">
                      Chapters: {block.chaptersCovered.join(' · ')}
                    </div>
                  </div>

                  {/* Action Links */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAskAIAboutBlock(block)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#E8D7E4] text-[#221329] bg-white hover:bg-[#F6ECF3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#7E22CE]" />
                      Quick AI Drill
                    </button>

                    {linkedVideo && (
                      <button
                        type="button"
                        onClick={() => onOpenVideo(linkedVideo.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-[#6D28D9] hover:bg-[#6D28D9]/8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Watch Linked Video
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
