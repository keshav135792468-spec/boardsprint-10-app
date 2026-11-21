import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SUBJECTS, type SubjectId } from '../data/syllabusData';
import { gameAudio } from '../game/audio';
import {
  answerActiveQuestion,
  createInitialGameState,
  LANE_CENTERS,
  movePlayerLane,
  PLAYER_Y,
  requestFire,
  setPlayerLane,
  startNewRun,
  stepGameSimulation,
  type GamePhase,
  type GameState,
} from '../game/engine';
import type { BoardQuizQuestion } from '../game/questions';

const GAME_BG_IMAGE = '/src/assets/images/floral_magic_game_arena_1795289200331.jpg';
const BEST_SCORE_KEY = 'boardsprint10_game_best_v1';

interface HudSnapshot {
  phase: GamePhase;
  hp: number;
  maxHp: number;
  ghostHp: number;
  score: number;
  bestScore: number;
  combo: number;
  maxCombo: number;
  wave: number;
  maxWaves: number;
  overdriveCharge: number;
  activeQuestion: BoardQuizQuestion | null;
  questionsAnswered: number;
  questionsCorrect: number;
  feedbackBanner: { text: string; tone: 'good' | 'bad' | 'info' } | null;
  elapsedSeconds: number;
}

interface StudyGameShellProps {
  autoStart?: boolean;
  onExit: () => void;
}

function readBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    return raw ? Math.max(0, Number(raw) || 0) : 0;
  } catch {
    return 0;
  }
}

function writeBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(Math.round(score)));
  } catch {
    // ignore storage errors
  }
}

function extractHud(state: GameState): HudSnapshot {
  return {
    phase: state.phase,
    hp: state.hp,
    maxHp: state.maxHp,
    ghostHp: state.ghostHp,
    score: Math.round(state.score),
    bestScore: Math.round(state.bestScore),
    combo: state.combo,
    maxCombo: state.maxCombo,
    wave: state.wave,
    maxWaves: state.maxWaves,
    overdriveCharge: Math.round(state.overdriveCharge),
    activeQuestion: state.activeQuestion,
    questionsAnswered: state.questionsAnswered,
    questionsCorrect: state.questionsCorrect,
    feedbackBanner: state.feedbackBanner
      ? { text: state.feedbackBanner.text, tone: state.feedbackBanner.tone }
      : null,
    elapsedSeconds: Math.round(state.elapsedTime),
  };
}

function drawArenaCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, state: GameState) {
  // Decaying trauma camera shake
  const shakeAmt = state.cameraTrauma * state.cameraTrauma * 12;
  const shakeX = shakeAmt > 0.2 ? (Math.random() - 0.5) * 2 * shakeAmt : 0;
  const shakeY = shakeAmt > 0.2 ? (Math.random() - 0.5) * 2 * shakeAmt : 0;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Twilight Enchanted Botanical Observatory Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#12091E');
  bgGrad.addColorStop(0.55, '#1D1032');
  bgGrad.addColorStop(1, '#261442');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.translate(shakeX, shakeY);

  // Subtle ambient starfield & brass observatory astrolabe arcs
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.92, Math.min(width, height) * 0.62, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.92, Math.min(width, height) * 0.42, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.24)';
  for (let i = 0; i < 28; i += 1) {
    const sx = ((i * 197.3) % 1) * width;
    const sy = ((i * 83.7 + state.elapsedTime * 0.015) % 0.78) * height;
    const r = (i % 3) === 0 ? 1.6 : 1;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4 Observatory Lanes with warm brass hairline rails
  const laneWidth = width * 0.21;
  for (let i = 0; i < LANE_CENTERS.length; i += 1) {
    const cx = LANE_CENTERS[i] * width;
    const isPlayerLane = i === state.playerLane && state.phase === 'playing';

    ctx.fillStyle = isPlayerLane ? 'rgba(245, 158, 11, 0.07)' : 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(cx - laneWidth / 2, 0, laneWidth, height * PLAYER_Y);

    ctx.strokeStyle = isPlayerLane ? 'rgba(245, 158, 11, 0.4)' : 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - laneWidth / 2, 0);
    ctx.lineTo(cx - laneWidth / 2, height * PLAYER_Y);
    ctx.moveTo(cx + laneWidth / 2, 0);
    ctx.lineTo(cx + laneWidth / 2, height * PLAYER_Y);
    ctx.stroke();

    // Subtle brass lane index marker near defense line
    ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`LANE ${i + 1}`, cx, height * (PLAYER_Y - 0.04));
  }

  // Defense Perimeter Line
  const defenseY = height * PLAYER_Y;
  ctx.strokeStyle = state.hp <= 1 ? 'rgba(220, 38, 38, 0.85)' : 'rgba(245, 158, 11, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.05, defenseY);
  ctx.lineTo(width * 0.95, defenseY);
  ctx.stroke();

  // Draw Projectiles (Revision Bolts)
  for (const proj of state.projectiles) {
    if (!proj.alive) continue;
    const px = proj.x * width;
    const py = proj.y * height;
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.roundRect(px - 3.5, py - 14, 7, 24, 3.5);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(px - 1.5, py - 11, 3, 16, 1.5);
    ctx.fill();
  }

  // Draw Enemies (3 Distinct Silhouettes + Windup Telegraph + Hit Flash + KO Dissolve)
  for (const enemy of state.enemies) {
    const ex = enemy.x * width;
    const ey = enemy.y * height;
    const r = enemy.radius * Math.min(width, height * 1.15);
    const alpha = enemy.dying ? Math.max(0, enemy.deathTimer / 0.3) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ex, ey);
    if (enemy.dying) {
      const s = 1 + (1 - alpha) * 0.45;
      ctx.scale(s, s);
    }

    // Colossus Windup Telegraph Ring!
    if (enemy.archetype === 'colossus' && enemy.telegraphTimer > 0 && !enemy.dying) {
      const pulse = 1 + Math.sin(enemy.telegraphTimer * 28) * 0.14;
      ctx.strokeStyle = '#F87171';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Aim sight line down to shield
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.lineTo(0, Math.max(20, defenseY - ey));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const fill = enemy.hitFlashTimer > 0 ? '#FFFFFF' : enemy.color;
    ctx.fillStyle = fill;
    ctx.strokeStyle = '#090D16';
    ctx.lineWidth = 2.5;

    if (enemy.archetype === 'dart') {
      // Sleek pointed downward dart
      ctx.beginPath();
      ctx.moveTo(0, r * 1.15);
      ctx.lineTo(r * 0.85, -r * 0.85);
      ctx.lineTo(0, -r * 0.45);
      ctx.lineTo(-r * 0.85, -r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.archetype === 'orbiter') {
      // Diamond prism flanker
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 1.05, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 1.05, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Armored octagonal Colossus tome
      const sides = 6;
      ctx.beginPath();
      for (let s = 0; s < sides; s += 1) {
        const a = (Math.PI * 2 * s) / sides + Math.PI / 6;
        const vx = Math.cos(a) * r;
        const vy = Math.sin(a) * r;
        if (s === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armor HP pips above Colossus
      for (let h = 0; h < enemy.maxHp; h += 1) {
        ctx.fillStyle = h < enemy.hp ? '#FDE68A' : 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(-14 + h * 11, -r - 10, 8, 4);
      }
    }

    // Crisp tag text on enemy
    ctx.fillStyle = enemy.hitFlashTimer > 0 ? '#0F172A' : '#FFFFFF';
    ctx.font = '700 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.label, 0, 1);

    ctx.restore();
  }

  // Draw Scholar Astrolabe Turret with Squash-and-Stretch
  const px = state.playerX * width;
  const py = defenseY;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(state.playerSquashX, state.playerSquashY);

  // Brass base arch
  ctx.fillStyle = '#D97706';
  ctx.strokeStyle = '#090D16';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-28, -10, 56, 20, 8);
  ctx.fill();
  ctx.stroke();

  // Barrel & golden astrolabe ring
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.roundRect(-7, -30, 14, 24, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FEF3C7';
  ctx.beginPath();
  ctx.arc(0, -4, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw Pooled Particles
  for (let i = 0; i < state.particles.length; i += 1) {
    const p = state.particles[i];
    if (!p.active) continue;
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Screen flash / Low-HP subtle peripheral vignette
  if (state.screenFlashAlpha > 0.01) {
    ctx.fillStyle = state.screenFlashColor;
    ctx.globalAlpha = state.screenFlashAlpha;
    ctx.fillRect(-20, -20, width + 40, height + 40);
    ctx.globalAlpha = 1;
  }

  if (state.hp <= 1 && state.phase === 'playing') {
    const vig = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.25,
      width / 2,
      height / 2,
      width * 0.72
    );
    vig.addColorStop(0, 'rgba(220, 38, 38, 0)');
    vig.addColorStop(1, 'rgba(220, 38, 38, 0.28)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

export function StudyGameShell({ autoStart = false, onExit }: StudyGameShellProps) {
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [muted, setMuted] = useState(false);
  const [bgImgFailed, setBgImgFailed] = useState(false);

  const stateRef = useRef<GameState>(
    autoStart
      ? startNewRun(createInitialGameState(readBestScore(), 'all'), 'all')
      : createInitialGameState(readBestScore(), 'all')
  );
  const [hud, setHud] = useState<HudSnapshot>(() => extractHud(stateRef.current));

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ width: 1280, height: 640 });
  const keysHeldRef = useRef<Set<string>>(new Set());

  const syncHudFromState = useCallback(() => {
    const st = stateRef.current;
    setHud(extractHud(st));
    const bodyState =
      st.phase === 'victory' || st.phase === 'gameover' ? 'gameover' : st.phase;
    document.body.dataset.state = bodyState;
    if (st.bestScore > readBestScore()) {
      writeBestScore(st.bestScore);
    }
  }, []);

  const handleStartGame = useCallback(
    (overrideSubject?: SubjectId | 'all') => {
      const subj = overrideSubject ?? subjectFilter;
      stateRef.current = startNewRun(stateRef.current, subj);
      keysHeldRef.current.clear();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      canvasRef.current?.focus();
      syncHudFromState();
    },
    [subjectFilter, syncHudFromState]
  );

  const handleTogglePause = useCallback(() => {
    const st = stateRef.current;
    if (st.phase === 'playing') {
      st.phase = 'paused';
      keysHeldRef.current.clear();
      syncHudFromState();
    } else if (st.phase === 'paused') {
      st.phase = 'playing';
      canvasRef.current?.focus();
      syncHudFromState();
    }
  }, [syncHudFromState]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      gameAudio.muted = next;
      return next;
    });
  }, []);

  const handleAnswerOption = useCallback(
    (optionIdx: number) => {
      const st = stateRef.current;
      if (st.phase !== 'playing') return;
      const res = answerActiveQuestion(st, optionIdx);
      if (res.correct) {
        gameAudio.playOverdriveSuccess();
      } else {
        gameAudio.playWrongAnswer();
      }
      syncHudFromState();
    },
    [syncHudFromState]
  );

  // Clean up body data-state on unmount
  useEffect(() => {
    syncHudFromState();
    return () => {
      delete document.body.dataset.state;
    };
  }, [syncHudFromState]);

  // Mount Canvas & 60fps decoupled loop ONCE
  useEffect(() => {
    const canvas = canvasRef.current;
    const mount = canvasMountRef.current;
    if (!canvas || !mount) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = mount.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      sizeRef.current = { width: w, height: h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(mount);

    let rafId = 0;
    let lastTime = performance.now();
    let lastElapsedSec = -1;
    let lastBannerText = '';

    const frame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const st = stateRef.current;
      if (st.phase === 'playing') {
        const ev = stepGameSimulation(st, rawDt);
        if (ev.shotFired) gameAudio.playShoot();
        if (ev.lightHit) gameAudio.playHit(false);
        if (ev.heavyKill) gameAudio.playHit(true);
        if (ev.telegraphStarted) gameAudio.playTelegraph();
        if (ev.shieldDamaged) gameAudio.playShieldHurt();
        if (ev.victoryTriggered) gameAudio.playVictory();
        if (ev.defeatTriggered) gameAudio.playDefeat();

        const sec = Math.floor(st.elapsedTime);
        const bannerText = st.feedbackBanner?.text || '';
        const shouldSyncHud =
          ev.lightHit ||
          ev.heavyKill ||
          ev.shieldDamaged ||
          ev.waveCleared ||
          ev.victoryTriggered ||
          ev.defeatTriggered ||
          bannerText !== lastBannerText ||
          (sec !== lastElapsedSec && st.ghostHp > st.hp);

        if (shouldSyncHud) {
          lastElapsedSec = sec;
          lastBannerText = bannerText;
          syncHudFromState();
        }
      }

      drawArenaCanvas(ctx, sizeRef.current.width, sizeRef.current.height, st);
      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [syncHudFromState]);

  // Unified Keyboard Input & Blur Release Hygiene
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const st = stateRef.current;

      if (st.phase === 'title') {
        if (key === 'Enter' || key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (key === 'm' || key === 'M') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (key === 'p' || key === 'P' || key === 'Escape') {
        if (st.phase === 'playing' || st.phase === 'paused') {
          e.preventDefault();
          handleTogglePause();
        }
        return;
      }

      if (key === 'r' || key === 'R') {
        if (st.phase === 'playing' || st.phase === 'paused' || st.phase === 'gameover' || st.phase === 'victory') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (st.phase !== 'playing') return;

      // Edge-triggered actions (prevent repeat auto-spam when held)
      const isFreshPress = !keysHeldRef.current.has(key);
      keysHeldRef.current.add(key);

      if (isFreshPress) {
        if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
          e.preventDefault();
          if (movePlayerLane(st, -1)) gameAudio.playMove();
        } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
          e.preventDefault();
          if (movePlayerLane(st, 1)) gameAudio.playMove();
        } else if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
          e.preventDefault();
          requestFire(st);
        } else if (key === '1' || key === '2' || key === '3' || key === '4') {
          e.preventDefault();
          handleAnswerOption(Number(key) - 1);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.key);
    };

    const clearHeld = () => {
      keysHeldRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    document.addEventListener('visibilitychange', clearHeld);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
      document.removeEventListener('visibilitychange', clearHeld);
    };
  }, [handleAnswerOption, handleStartGame, handleToggleMute, handleTogglePause]);

  // Pointer click/tap directly on canvas moves turret to lane & fires!
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = stateRef.current;
    if (st.phase !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / Math.max(1, rect.width);
    let nearestLane = 0;
    let bestDist = Infinity;
    LANE_CENTERS.forEach((cx, idx) => {
      const dist = Math.abs(cx - normX);
      if (dist < bestDist) {
        bestDist = dist;
        nearestLane = idx;
      }
    });
    if (setPlayerLane(st, nearestLane)) {
      gameAudio.playMove();
    }
    requestFire(st);
  };

  return (
    <div
      data-testid="study-game-shell"
      className="fixed inset-0 z-50 bg-[#0B1324] text-[#F8FAFC] flex flex-col select-none overflow-hidden"
    >
      {/* Isolated Canvas Playfield Container (absolute canvas prevents intrinsic height from affecting flex dock) */}
      <div
        ref={canvasMountRef}
        className={`relative flex-1 min-h-0 w-full overflow-hidden ${hud.phase === 'title' ? 'invisible' : 'visible'}`}
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          data-testid="game-canvas"
          onPointerDown={handleCanvasPointerDown}
          aria-label="Syllabus Blitz defense arena"
          className="absolute inset-0 block w-full h-full outline-none cursor-crosshair"
        />

        {/* World-Matched Low-Occlusion Perimeter HUD (pointer-events-none, ZERO backdrop-filter) */}
        {hud.phase !== 'title' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
            {/* Top Perimeter Clusters */}
            <div className="flex items-start justify-between gap-4">
              {/* Top-Left: Vitality Shield Sockets & Wave */}
              <div
                className="px-3.5 py-2.5 rounded-lg border border-[#F59E0B]/35"
                style={{ backgroundColor: 'rgba(11, 19, 36, 0.84)' }}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[10px] font-mono tracking-wider text-[#FDE68A]/80 uppercase">
                      Shield Integrity
                    </div>
                    <div className="mt-1 flex items-center gap-1.5" aria-label={`Shield ${hud.hp} of ${hud.maxHp}`}>
                      {Array.from({ length: hud.maxHp }).map((_, idx) => {
                        const isFull = idx < hud.hp;
                        const isGhost = !isFull && idx < Math.ceil(hud.ghostHp);
                        return (
                          <svg
                            key={idx}
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 2L4 5.5v6.2c0 5.1 3.4 9.5 8 10.8 4.6-1.3 8-5.7 8-10.8V5.5L12 2z"
                              fill={isFull ? '#F59E0B' : isGhost ? '#DC2626' : 'rgba(15, 23, 42, 0.7)'}
                              stroke={isFull ? '#FEF3C7' : '#64748B'}
                              strokeWidth="1.8"
                            />
                            {isFull && (
                              <path
                                d="M12 4.5L6.5 7v4.5"
                                fill="none"
                                stroke="#FFFBEB"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                              />
                            )}
                          </svg>
                        );
                      })}
                    </div>
                  </div>
                  <div className="pl-3 border-l border-[#F59E0B]/25">
                    <div className="text-[10px] font-mono tracking-wider text-[#94A3B8] uppercase">
                      Wave
                    </div>
                    <div className="font-mono text-xl font-bold text-[#F8FAFC] tabular-nums leading-none mt-0.5">
                      {hud.wave}/{hud.maxWaves}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top-Center: Hero Score & Combo Readout */}
              <div
                className="px-4 py-2 rounded-lg border border-[#F59E0B]/35 text-center"
                style={{ backgroundColor: 'rgba(11, 19, 36, 0.84)' }}
              >
                <div className="text-[10px] font-mono tracking-wider text-[#94A3B8] uppercase">
                  Score · Best {hud.bestScore}
                </div>
                <div
                  data-testid="game-score"
                  className="font-mono text-2xl sm:text-3xl font-bold text-[#FEF3C7] tabular-nums leading-tight"
                >
                  {hud.score}
                </div>
                {hud.combo > 1 && (
                  <div className="font-mono text-[11px] font-semibold text-[#34D399] tabular-nums">
                    {hud.combo}x STREAK
                  </div>
                )}
              </div>

              {/* Top-Right: Square SVG Utility Controls */}
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleToggleMute();
                  }}
                  aria-label={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
                  title="Mute [M]"
                  className="w-10 h-10 rounded-lg border border-[#F59E0B]/35 flex items-center justify-center text-[#FEF3C7] hover:border-[#F59E0B]"
                  style={{ backgroundColor: 'rgba(11, 19, 36, 0.88)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    {muted ? (
                      <path d="M22 9l-6 6M16 9l6 6" stroke="#F87171" />
                    ) : (
                      <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
                    )}
                  </svg>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleTogglePause();
                  }}
                  aria-label="Pause game (P)"
                  title="Pause [P]"
                  className="w-10 h-10 rounded-lg border border-[#F59E0B]/35 flex items-center justify-center text-[#FEF3C7] hover:border-[#F59E0B]"
                  style={{ backgroundColor: 'rgba(11, 19, 36, 0.88)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleStartGame();
                  }}
                  aria-label="Restart game (R)"
                  title="Restart [R]"
                  className="w-10 h-10 rounded-lg border border-[#F59E0B]/35 flex items-center justify-center text-[#FEF3C7] hover:border-[#F59E0B]"
                  style={{ backgroundColor: 'rgba(11, 19, 36, 0.88)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Live Feedback Banner (non-blocking) */}
            {hud.feedbackBanner && (
              <div className="self-center px-4 py-1.5 rounded-md text-xs font-medium border"
                style={{
                  backgroundColor:
                    hud.feedbackBanner.tone === 'good'
                      ? 'rgba(6, 78, 59, 0.92)'
                      : hud.feedbackBanner.tone === 'bad'
                      ? 'rgba(127, 29, 29, 0.92)'
                      : 'rgba(15, 23, 42, 0.92)',
                  borderColor:
                    hud.feedbackBanner.tone === 'good'
                      ? '#34D399'
                      : hud.feedbackBanner.tone === 'bad'
                      ? '#F87171'
                      : '#F59E0B',
                }}
              >
                {hud.feedbackBanner.text}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Unified Trivia Overdrive Dock (sits cleanly below the canvas playfield, zero occlusion!) */}
      {hud.phase !== 'title' && hud.activeQuestion && (
        <div
          data-testid="game-overdrive-dock"
          className="shrink-0 border-t border-[#F59E0B]/30 px-4 sm:px-6 py-3"
          style={{ backgroundColor: '#0E172A' }}
        >
          <div className="max-w-5xl mx-auto space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-semibold text-[#F59E0B] uppercase shrink-0">
                  Overdrive Quiz · {hud.activeQuestion.subjectLabel}
                </span>
                <span className="text-[#E2E8F0] font-medium truncate">
                  {hud.activeQuestion.prompt}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                  Shield Charge {hud.overdriveCharge}%
                </span>
                <div className="w-20 h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] transition-all"
                    style={{ width: `${hud.overdriveCharge}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {hud.activeQuestion.options.map((opt, idx) => (
                <button
                  key={`${hud.activeQuestion?.id}-${idx}`}
                  type="button"
                  onClick={() => handleAnswerOption(idx)}
                  className="text-left px-3 py-2 rounded-lg border border-[#334155] bg-[#162238] hover:border-[#F59E0B] hover:bg-[#1E2F4D] text-xs sm:text-sm text-[#F8FAFC] transition-colors flex items-center gap-2 min-h-[42px]"
                >
                  <span className="font-mono text-[11px] font-bold text-[#F59E0B] shrink-0">
                    [{idx + 1}]
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TITLE SCREEN OVERLAY (Illustrated Key-Art Backdrop + Asymmetric Left Negative Space + Inline SVG Lockup) */}
      {hud.phase === 'title' && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between overflow-hidden">
          {!bgImgFailed ? (
            <img
              src={GAME_BG_IMAGE}
              alt="Twilight scholar observatory courtyard"
              referrerPolicy="no-referrer"
              onError={() => setBgImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B1324] via-[#172542] to-[#263248]" />
          )}

          {/* Soft left-side atmospheric scrim over the negative space */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(18,9,30,0.92) 0%, rgba(18,9,30,0.72) 44%, rgba(18,9,30,0.18) 100%)',
            }}
          />

          <div className="relative z-10 flex-1 flex items-center px-8 sm:px-14 lg:px-20">
            <div className="max-w-md space-y-6">
              {/* Bespoke Inline SVG Title Crest Lockup */}
              <svg
                viewBox="0 0 440 124"
                className="w-full max-w-[420px] h-auto overflow-visible"
                role="img"
                aria-label="Syllabus Blitz: Observatory Defender"
              >
                <g>
                  <circle cx="30" cy="46" r="22" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
                  <circle cx="30" cy="46" r="13" fill="none" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M30 18v56M2 46h56" stroke="#F59E0B" strokeWidth="1.4" opacity="0.7" />
                  <circle cx="30" cy="46" r="4" fill="#FEF3C7" />
                </g>
                <text
                  x="68"
                  y="52"
                  fill="#FEF3C7"
                  fontFamily="Fraunces, Georgia, serif"
                  fontWeight="700"
                  fontSize="40"
                  letterSpacing="-0.5"
                >
                  Syllabus Blitz
                </text>
                <line x1="68" y1="68" x2="392" y2="68" stroke="#F59E0B" strokeWidth="1.5" opacity="0.6" />
                <text
                  x="68"
                  y="90"
                  fill="#CBD5E1"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontWeight="500"
                  fontSize="12.5"
                  letterSpacing="1.3"
                >
                  OBSERVATORY DEFENDER · CLASS 10
                </text>
              </svg>

              {/* Subject Deck Selector */}
              <div className="space-y-2">
                <label
                  htmlFor="game-subject-filter"
                  className="block text-xs font-mono uppercase tracking-wider text-[#CBD5E1]"
                >
                  Overdrive Question Deck
                </label>
                <select
                  id="game-subject-filter"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value as SubjectId | 'all')}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-lg bg-[#0E172A] border border-[#F59E0B]/40 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="all">All 7 Subjects (Pre-Board Mix)</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* <= 3 Clean Menu Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => handleStartGame()}
                  className="px-7 py-3 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-base tracking-tight transition-colors shadow-lg cursor-pointer"
                >
                  Start Defense
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  className="px-5 py-3 rounded-lg border border-[#94A3B8]/40 text-[#E2E8F0] hover:bg-white/10 font-medium text-sm transition-colors cursor-pointer"
                >
                  Back to Planner
                </button>
              </div>
            </div>
          </div>

          {/* Single Flat Borderless Control Hint Line */}
          <div className="relative z-10 px-8 sm:px-14 lg:px-20 pb-6 text-xs font-mono text-[#CBD5E1]/90">
            A/D or ←/→ Move · Space or Click Fire · 1–4 Answer Overdrive Quiz · P Pause · M Mute
          </div>
        </div>
      )}

      {/* SINGLE FOCUSED STATUS MODAL: PAUSED / VICTORY / GAME OVER */}
      {(hud.phase === 'paused' || hud.phase === 'victory' || hud.phase === 'gameover') && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            hud.phase === 'paused'
              ? 'Game paused'
              : hud.phase === 'victory'
              ? 'Pre-board defense victory'
              : 'Shield breached game over'
          }
          className="absolute inset-0 z-20 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(9, 13, 22, 0.78)' }}
        >
          <div className="w-full max-w-md rounded-xl border border-[#F59E0B]/40 bg-[#101C33] p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-[#F59E0B]">
                {hud.phase === 'paused'
                  ? 'Simulation Paused'
                  : hud.phase === 'victory'
                  ? 'All 5 Waves Cleared'
                  : 'Observatory Shield Breached'}
              </div>
              <h2 className="font-display text-3xl font-semibold text-[#FEF3C7]">
                {hud.phase === 'paused'
                  ? 'Take a Breather'
                  : hud.phase === 'victory'
                  ? 'Pre-Board Ready!'
                  : 'Defenses Overwhelmed'}
              </h2>
            </div>

            {/* 3 Tabular-Nums Stat Tiles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#0B1324] border border-[#334155]">
                <div className="text-[10px] font-mono uppercase text-[#94A3B8]">Score</div>
                <div className="font-mono text-xl font-bold text-[#FEF3C7] tabular-nums mt-0.5">
                  {hud.score}
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] tabular-nums">
                  Best {hud.bestScore}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B1324] border border-[#334155]">
                <div className="text-[10px] font-mono uppercase text-[#94A3B8]">Wave</div>
                <div className="font-mono text-xl font-bold text-[#F8FAFC] tabular-nums mt-0.5">
                  {hud.wave}/{hud.maxWaves}
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] tabular-nums">
                  {hud.elapsedSeconds}s elapsed
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B1324] border border-[#334155]">
                <div className="text-[10px] font-mono uppercase text-[#94A3B8]">Quiz</div>
                <div className="font-mono text-xl font-bold text-[#34D399] tabular-nums mt-0.5">
                  {hud.questionsCorrect}/{hud.questionsAnswered}
                </div>
                <div className="font-mono text-[10px] text-[#94A3B8] tabular-nums">
                  Max {hud.maxCombo}x
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {hud.phase === 'paused' ? (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Resume
                </button>
              ) : (
                <button
                  type="button"
                  data-start="true"
                  onClick={() => handleStartGame()}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  {hud.phase === 'victory' ? 'Play Again' : 'Try Again'}
                </button>
              )}

              {hud.phase === 'paused' && (
                <button
                  type="button"
                  onClick={() => handleStartGame()}
                  className="px-4 py-2.5 rounded-lg border border-[#475569] text-[#E2E8F0] hover:bg-white/10 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Restart
                </button>
              )}

              <button
                type="button"
                onClick={onExit}
                className="px-4 py-2.5 rounded-lg border border-[#475569] text-[#CBD5E1] hover:bg-white/10 text-sm font-medium transition-colors whitespace-nowrap"
              >
                Exit to Planner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
