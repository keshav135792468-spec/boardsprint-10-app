import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Gamepad2, Menu, X } from 'lucide-react';
import { ScheduleView } from './components/ScheduleView';
import { SyllabusTrackerView } from './components/SyllabusTrackerView';
import { VideosResourcesView } from './components/VideosResourcesView';
import { AIStudioView, type AITab } from './components/AIStudioView';
import { WorkspaceSyncView } from './components/WorkspaceSyncView';
import { StudyGameShell } from './components/StudyGameShell';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { SUBJECTS, type StudyBlock } from './data/syllabusData';
import { buildProgressSummaryForAI } from './utils/scheduleEngine';

type ActiveView = 'schedule' | 'syllabus' | 'videos' | 'ai' | 'workspace';

const STORAGE_BLOCKS = 'boardsprint10_blocks_v1';
const STORAGE_CHAPTERS = 'boardsprint10_chapters_v1';
const STORAGE_VIDEOS = 'boardsprint10_videos_v1';

function loadSetFromStorage(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((x) => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function saveSetToStorage(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // ignore storage errors
  }
}

export default function App() {
  const initialUrlParams = useMemo(() => {
    if (typeof window === 'undefined') return { view: null as string | null, autostart: false };
    const params = new URLSearchParams(window.location.search);
    return {
      view: params.get('view'),
      autostart: params.get('autostart') === '1',
    };
  }, []);

  const [activeView, setActiveView] = useState<ActiveView>('schedule');
  const [gameOpen, setGameOpen] = useState<boolean>(
    initialUrlParams.view === 'game' || initialUrlParams.autostart
  );
  const [gameAutoStart, setGameAutoStart] = useState<boolean>(initialUrlParams.autostart);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [completedBlockIds, setCompletedBlockIds] = useState<Set<string>>(() =>
    loadSetFromStorage(STORAGE_BLOCKS)
  );
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(() =>
    loadSetFromStorage(STORAGE_CHAPTERS)
  );
  const [watchedVideoIds, setWatchedVideoIds] = useState<Set<string>>(() =>
    loadSetFromStorage(STORAGE_VIDEOS)
  );

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [aiPrefill, setAiPrefill] = useState<{
    subject: string;
    prompt: string;
    tab: AITab;
  } | null>(null);

  useEffect(() => {
    saveSetToStorage(STORAGE_BLOCKS, completedBlockIds);
  }, [completedBlockIds]);

  useEffect(() => {
    saveSetToStorage(STORAGE_CHAPTERS, completedChapterIds);
  }, [completedChapterIds]);

  useEffect(() => {
    saveSetToStorage(STORAGE_VIDEOS, watchedVideoIds);
  }, [watchedVideoIds]);

  const toggleBlock = useCallback((blockId: string) => {
    setCompletedBlockIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }, []);

  const toggleChapter = useCallback((chapterId: string) => {
    setCompletedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }, []);

  const toggleVideoWatched = useCallback((videoId: string) => {
    setWatchedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  }, []);

  const progressSummary = useMemo(
    () => buildProgressSummaryForAI(completedBlockIds, completedChapterIds),
    [completedBlockIds, completedChapterIds]
  );

  const handleAskAIAboutBlock = useCallback((block: StudyBlock) => {
    const subj = SUBJECTS.find((s) => s.id === block.subjectId);
    setAiPrefill({
      subject: subj?.name || 'Class 10th',
      prompt: `Give me 5 CBSE board-style rapid revision questions and 3 key scoring tips for: ${block.title} (${block.chaptersCovered.join(', ')}).`,
      tab: 'fast',
    });
    setActiveView('ai');
  }, []);

  const handleDrillChapter = useCallback((subjectName: string, chapterTitle: string) => {
    setAiPrefill({
      subject: subjectName,
      prompt: `Create a high-yield CBSE Class 10 board revision drill (5 MCQs + 2 expected 3-mark points) for ${subjectName}: ${chapterTitle}.`,
      tab: 'fast',
    });
    setActiveView('ai');
  }, []);

  const handleOpenVideo = useCallback((videoId: string) => {
    setSelectedVideoId(videoId);
    setActiveView('videos');
  }, []);

  const handleOpenGame = () => {
    setGameAutoStart(false);
    setGameOpen(true);
    setMobileMenuOpen(false);
  };

  const navItems: Array<{ id: ActiveView; label: string }> = [
    { id: 'schedule', label: 'Schedule' },
    { id: 'syllabus', label: 'Syllabus' },
    { id: 'videos', label: 'Videos' },
    { id: 'ai', label: 'AI Studio' },
    { id: 'workspace', label: 'Workspace' },
  ];

  // Full-Viewport Game Shell hides website header & footer completely
  if (gameOpen) {
    return (
      <StudyGameShell
        autoStart={gameAutoStart}
        onExit={() => {
          setGameOpen(false);
          setGameAutoStart(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col floral-magic-canvas text-[#221329] relative overflow-x-clip">
      {/* Subtle Ambient Botanical Filigree Corner Flourishes (purely decorative, pointer-events-none) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 240 240"
        className="pointer-events-none fixed top-16 left-0 w-44 h-44 text-[#BE185D]/[0.06] hidden xl:block"
        fill="none"
      >
        <path
          d="M0 0C48 18 82 54 96 112C112 72 152 46 204 44C152 80 124 126 116 196C94 146 56 112 0 98V0Z"
          fill="currentColor"
        />
        <circle cx="152" cy="76" r="14" stroke="#6D28D9" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="96" cy="144" r="9" stroke="#B45309" strokeOpacity="0.22" strokeWidth="1.5" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 240 240"
        className="pointer-events-none fixed top-16 right-0 w-44 h-44 text-[#6D28D9]/[0.06] hidden xl:block -scale-x-100"
        fill="none"
      >
        <path
          d="M0 0C48 18 82 54 96 112C112 72 152 46 204 44C152 80 124 126 116 196C94 146 56 112 0 98V0Z"
          fill="currentColor"
        />
        <circle cx="152" cy="76" r="14" stroke="#BE185D" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="96" cy="144" r="9" stroke="#B45309" strokeOpacity="0.22" strokeWidth="1.5" />
      </svg>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FBF6F9]/92 backdrop-blur-md border-b border-[#E8D7E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('schedule')}
            className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#221329] whitespace-nowrap shrink-0 cursor-pointer"
          >
            BoardSprint 10
          </button>

          {/* Zone 2: 5 clean single-line text nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-[#7E22CE] text-[#221329]'
                      : 'border-transparent text-[#614B69] hover:text-[#221329]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Install App (when eligible) + Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex">
              <PWAInstallButton compact />
            </div>

            <button
              type="button"
              onClick={handleOpenGame}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg enchanted-cta text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              Play Study Game
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E8D7E4] text-[#221329] bg-white/95"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-[#E8D7E4] bg-white/98 px-4 py-3 flex flex-col gap-1"
          >
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-[#6D28D9]/10 text-[#5B21B6]'
                      : 'text-[#221329] hover:bg-[#F6ECF3]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="pt-2 mt-1 border-t border-[#E8D7E4] sm:hidden empty:hidden">
              <PWAInstallButton />
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeView === 'schedule' && (
          <ScheduleView
            completedBlockIds={completedBlockIds}
            completedChapterIds={completedChapterIds}
            onToggleBlock={toggleBlock}
            onAskAIAboutBlock={handleAskAIAboutBlock}
            onOpenVideo={handleOpenVideo}
            onNavigateToWorkspace={() => setActiveView('workspace')}
          />
        )}

        {activeView === 'syllabus' && (
          <SyllabusTrackerView
            completedBlockIds={completedBlockIds}
            completedChapterIds={completedChapterIds}
            onToggleChapter={toggleChapter}
            onDrillChapter={handleDrillChapter}
          />
        )}

        {activeView === 'videos' && (
          <VideosResourcesView
            watchedVideoIds={watchedVideoIds}
            onToggleVideoWatched={toggleVideoWatched}
            initialSelectedVideoId={selectedVideoId}
          />
        )}

        {activeView === 'ai' && (
          <AIStudioView
            progressSummary={progressSummary}
            prefillPrompt={aiPrefill}
            onConsumePrefill={() => setAiPrefill(null)}
          />
        )}

        {activeView === 'workspace' && (
          <WorkspaceSyncView
            completedBlockIds={completedBlockIds}
            completedChapterIds={completedChapterIds}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="relative z-10 border-t border-[#E8D7E4] bg-[#FBF6F9]/90 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#614B69]">
          <span>BoardSprint 10 · CBSE Class 10th Pre-Board Sprint (Nov 21 – Nov 30, 2026)</span>
          <span>Maths · Science · SST · English Communicative · Hindi A · AI (417) · Punjabi</span>
        </div>
      </footer>

      <OfflineIndicator />
    </div>
  );
}
