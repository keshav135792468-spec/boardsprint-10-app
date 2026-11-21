import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, PlayCircle } from 'lucide-react';
import { REFERENCE_VIDEOS, SUBJECTS } from '../data/syllabusData';

interface VideosResourcesViewProps {
  watchedVideoIds: Set<string>;
  onToggleVideoWatched: (videoId: string) => void;
  initialSelectedVideoId?: string | null;
}

const NOTES_STORAGE_KEY = 'boardsprint10_video_notes_v1';

export function VideosResourcesView({
  watchedVideoIds,
  onToggleVideoWatched,
  initialSelectedVideoId,
}: VideosResourcesViewProps) {
  const [activeVideoId, setActiveVideoId] = useState<string>(
    initialSelectedVideoId || REFERENCE_VIDEOS[0].id
  );
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (initialSelectedVideoId) {
      setActiveVideoId(initialSelectedVideoId);
    }
  }, [initialSelectedVideoId]);

  const activeVideo =
    REFERENCE_VIDEOS.find((v) => v.id === activeVideoId) || REFERENCE_VIDEOS[0];

  const handleNoteChange = (videoId: string, value: string) => {
    setNotesMap((prev) => {
      const next = { ...prev, [videoId]: value };
      try {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore quota errors
      }
      return next;
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium text-[#7E22CE]">
          Curated Video Playlist & Study Kit Inventory · {watchedVideoIds.size}/{REFERENCE_VIDEOS.length} Videos Watched
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#221329] mt-1 tracking-tight">
          Reference Videos & Resource Matrix
        </h1>
        <p className="text-sm text-[#614B69] mt-1.5 max-w-2xl">
          All 5 of your YouTube reference lectures mapped directly into your 10-day sprint, alongside
          your offline NCERT/Competency/PYQ books and online material plan for AI and Punjabi.
        </p>
      </div>

      {/* Video Player + Playlist Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Player + Personal Timestamp Notes */}
        <div className="lg:col-span-7 enchanted-card rounded-2xl overflow-hidden">
          <div className="aspect-video bg-[#1A0D26] relative">
            <iframe
              key={activeVideo.youtubeId}
              src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0`}
              title={activeVideo.label}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-[#614B69]">
                  {activeVideo.recommendedSlot} · Video ID: {activeVideo.youtubeId}
                </div>
                <h2 className="font-display text-2xl font-bold text-[#221329] mt-0.5">
                  {activeVideo.label}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleVideoWatched(activeVideo.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    watchedVideoIds.has(activeVideo.id)
                      ? 'bg-[#047857] text-white border-[#047857]'
                      : 'bg-white text-[#221329] border-[#E8D7E4] hover:bg-[#F6ECF3]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {watchedVideoIds.has(activeVideo.id) ? 'Watched' : 'Mark Watched'}
                </button>

                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E8D7E4] text-[#6D28D9] hover:bg-[#F6ECF3] transition-colors whitespace-nowrap shrink-0"
                >
                  Open on YouTube
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <p className="text-sm text-[#614B69] leading-relaxed">{activeVideo.focusTip}</p>

            <div>
              <label
                htmlFor="video-notes-input"
                className="block text-xs font-semibold text-[#221329] mb-1.5"
              >
                Your Revision Notes & Timestamps (saved locally)
              </label>
              <textarea
                id="video-notes-input"
                rows={3}
                value={notesMap[activeVideo.id] || ''}
                onChange={(e) => handleNoteChange(activeVideo.id, e.target.value)}
                placeholder="Write key formulas, timestamps (e.g. 14:20 — important proof), or tricky points from this video..."
                className="w-full rounded-xl border border-[#E8D7E4] bg-[#FBF6F9] p-3 text-sm text-[#221329] placeholder:text-[#8E7896] focus:outline-none focus:border-[#6D28D9]"
              />
            </div>
          </div>
        </div>

        {/* 5 Reference Video Queue */}
        <div className="lg:col-span-5 enchanted-card rounded-2xl overflow-hidden divide-y divide-[#E8D7E4]">
          <div className="px-5 py-4 bg-[#FBF6F9]/90">
            <h2 className="font-display text-xl font-bold text-[#221329]">
              Your 5 Reference Videos
            </h2>
            <p className="text-xs text-[#614B69] mt-0.5">
              Select a lecture to play and log revision takeaways.
            </p>
          </div>
          {REFERENCE_VIDEOS.map((vid, idx) => {
            const isSelected = vid.id === activeVideo.id;
            const isWatched = watchedVideoIds.has(vid.id);
            return (
              <div
                key={vid.id}
                className={`p-4 flex items-start gap-3 transition-colors ${
                  isSelected ? 'bg-[#6D28D9]/8' : 'hover:bg-[#FBF6F9]/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveVideoId(vid.id)}
                  className="flex-1 text-left min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs text-[#614B69]">
                    <span className="font-mono font-semibold text-[#7E22CE]">0{idx + 1}.</span>
                    <span className="truncate">{vid.recommendedSlot}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#221329] mt-0.5 flex items-center gap-1.5">
                    <PlayCircle
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#6D28D9]' : 'text-[#614B69]'
                      }`}
                    />
                    <span className="truncate">{vid.label}</span>
                  </div>
                  <div className="text-xs text-[#614B69] mt-1 truncate font-mono">
                    youtu.be/{vid.youtubeId}
                  </div>
                </button>

                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isWatched}
                  aria-label={`Mark ${vid.label} as ${isWatched ? 'unwatched' : 'watched'}`}
                  onClick={() => onToggleVideoWatched(vid.id)}
                  className={`mt-1 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    isWatched
                      ? 'bg-[#047857] border-[#047857] text-white'
                      : 'bg-white border-[#D3BDD0] text-transparent hover:border-[#6D28D9]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resource Availability Matrix Across All 7 Subjects */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#221329]">
            Offline vs. Online Resource Map
          </h2>
          <p className="text-sm text-[#614B69] mt-1">
            Matches your exact physical books with online backups so you never waste study time
            hunting for material.
          </p>
        </div>

        <div className="enchanted-card rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[#E8D7E4] bg-[#FBF6F9]/90 text-xs font-semibold text-[#614B69]">
                <th className="py-3 px-5">Subject</th>
                <th className="py-3 px-4">NCERT Textbook</th>
                <th className="py-3 px-4">Competency Workbook</th>
                <th className="py-3 px-4">10-Yr Solved PYQs</th>
                <th className="py-3 px-4">Offline Sample Paper</th>
                <th className="py-3 px-4">Online Supplement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8D7E4] text-sm">
              {SUBJECTS.map((subj) => {
                const hasNcert = subj.resources.includes('NCERT Textbook');
                const hasComp = subj.resources.includes('Competency Workbook');
                const hasPyq = subj.resources.includes('10-Yr Solved Papers');
                const hasSample = subj.resources.includes('Offline Sample Paper');
                const hasOnline = subj.resources.includes('Online Notes & PYQs');
                return (
                  <tr key={subj.id} className="hover:bg-[#FBF6F9]/70 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#221329]">
                      {subj.name}
                      <span className="block font-mono text-[11px] text-[#7E22CE] font-normal">
                        {subj.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {hasNcert ? (
                        <span className="text-[#047857] font-medium">Available (Offline)</span>
                      ) : (
                        <span className="text-[#614B69]">CBSE Online PDF</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {hasComp ? (
                        <span className="text-[#047857] font-medium">Available (Offline)</span>
                      ) : (
                        <span className="text-[#614B69]">Online CBSE Q-Bank</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {hasPyq ? (
                        <span className="text-[#047857] font-medium">Available (Offline)</span>
                      ) : (
                        <span className="text-[#614B69]">Online PYQ PDFs</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {hasSample ? (
                        <span className="text-[#047857] font-medium">Available (Offline)</span>
                      ) : (
                        <span className="text-[#614B69]">Online SQP</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#614B69]">
                      {hasOnline ? 'Primary online pack' : 'Backup if needed'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
