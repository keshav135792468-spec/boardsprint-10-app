import type { SubjectId } from '../data/syllabusData';
import { BOARD_QUESTIONS, pickQuestionsForSubject, type BoardQuizQuestion } from './questions';

export type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';
export type EnemyArchetype = 'dart' | 'colossus' | 'orbiter';

export interface Projectile {
  id: number;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  vy: number;
  alive: boolean;
}

export interface EnemyEntity {
  id: number;
  archetype: EnemyArchetype;
  lane: number; // 0..3
  x: number; // normalized 0..1
  baseX: number;
  y: number; // normalized 0..1
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  label: string;
  color: string;
  age: number;
  hitFlashTimer: number;
  telegraphTimer: number; // >0 when Colossus is telegraphing a shockwave
  telegraphTriggered: boolean;
  dying: boolean;
  deathTimer: number; // KO dissolve animation (0.3s)
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GameEvents {
  shotFired: boolean;
  lightHit: boolean;
  heavyKill: boolean;
  telegraphStarted: boolean;
  shieldDamaged: boolean;
  waveCleared: boolean;
  victoryTriggered: boolean;
  defeatTriggered: boolean;
}

export interface GameState {
  phase: GamePhase;
  subjectFilter: SubjectId | 'all';
  playerLane: number; // 0..3
  playerX: number; // smoothed normalized X
  playerSquashX: number;
  playerSquashY: number;
  fireCooldown: number;
  fireBufferTimer: number;
  hp: number;
  maxHp: number;
  ghostHp: number; // trailing damage bar
  score: number;
  bestScore: number;
  combo: number;
  maxCombo: number;
  wave: number;
  maxWaves: number;
  waveSpawned: number;
  waveTargetKills: number;
  waveKills: number;
  spawnTimer: number;
  elapsedTime: number;
  hitstopTimer: number;
  cameraTrauma: number;
  screenFlashAlpha: number;
  screenFlashColor: string;
  nextEntityId: number;
  enemies: EnemyEntity[];
  projectiles: Projectile[];
  particles: Particle[];
  particleCursor: number;
  // Trivia Overdrive state
  overdriveCharge: number; // 0..100
  activeQuestion: BoardQuizQuestion | null;
  questionsAnswered: number;
  questionsCorrect: number;
  questionIndex: number;
  feedbackBanner: { text: string; tone: 'good' | 'bad' | 'info'; timer: number } | null;
  defeatDelayTimer: number;
}

export const LANE_CENTERS = [0.17, 0.39, 0.61, 0.83] as const;
export const PLAYER_Y = 0.86;
const PARTICLE_POOL_SIZE = 96;
const MAX_SIM_DT = 0.05;

const ARCHETYPE_TAGS: Record<EnemyArchetype, string[]> = {
  dart: ['MCQ', '1-MK', 'DEF', 'PYQ'],
  colossus: ['5-MK', 'CASE', 'PROOF', 'MOCK'],
  orbiter: ['COMP', 'A/R', 'NUM', 'MAP'],
};

function createParticlePool(): Particle[] {
  const pool: Particle[] = [];
  for (let i = 0; i < PARTICLE_POOL_SIZE; i += 1) {
    pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.4,
      size: 4,
      color: '#F59E0B',
    });
  }
  return pool;
}

export function spawnParticles(
  state: GameState,
  x: number,
  y: number,
  count: number,
  color: string,
  speedScale = 0.35
): void {
  for (let i = 0; i < count; i += 1) {
    const p = state.particles[state.particleCursor];
    state.particleCursor = (state.particleCursor + 1) % state.particles.length;
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
    const speed = (0.35 + Math.random() * 0.85) * speedScale;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.maxLife = 0.28 + Math.random() * 0.25;
    p.life = p.maxLife;
    p.size = 2.5 + Math.random() * 4;
    p.color = color;
  }
}

export function createInitialGameState(
  bestScore = 0,
  subjectFilter: SubjectId | 'all' = 'all'
): GameState {
  const pool = pickQuestionsForSubject(subjectFilter);
  return {
    phase: 'title',
    subjectFilter,
    playerLane: 1,
    playerX: LANE_CENTERS[1],
    playerSquashX: 1,
    playerSquashY: 1,
    fireCooldown: 0,
    fireBufferTimer: 0,
    hp: 5,
    maxHp: 5,
    ghostHp: 5,
    score: 0,
    bestScore,
    combo: 0,
    maxCombo: 0,
    wave: 1,
    maxWaves: 5,
    waveSpawned: 0,
    waveTargetKills: 6,
    waveKills: 0,
    spawnTimer: 1.4, // gentle opening so player survives first 5s safely without input
    elapsedTime: 0,
    hitstopTimer: 0,
    cameraTrauma: 0,
    screenFlashAlpha: 0,
    screenFlashColor: '#F59E0B',
    nextEntityId: 1,
    enemies: [],
    projectiles: [],
    particles: createParticlePool(),
    particleCursor: 0,
    overdriveCharge: 40,
    activeQuestion: pool[0] || BOARD_QUESTIONS[0],
    questionsAnswered: 0,
    questionsCorrect: 0,
    questionIndex: 0,
    feedbackBanner: null,
    defeatDelayTimer: 0,
  };
}

export function startNewRun(state: GameState, subjectFilter = state.subjectFilter): GameState {
  const fresh = createInitialGameState(Math.max(state.bestScore, state.score), subjectFilter);
  fresh.phase = 'playing';
  return fresh;
}

export function movePlayerLane(state: GameState, delta: -1 | 1): boolean {
  if (state.phase !== 'playing') return false;
  const next = Math.max(0, Math.min(LANE_CENTERS.length - 1, state.playerLane + delta));
  if (next === state.playerLane) return false;
  state.playerLane = next;
  state.playerSquashX = 1.18;
  state.playerSquashY = 0.86;
  return true;
}

export function setPlayerLane(state: GameState, lane: number): boolean {
  if (state.phase !== 'playing') return false;
  const clamped = Math.max(0, Math.min(LANE_CENTERS.length - 1, lane));
  if (clamped === state.playerLane) return false;
  state.playerLane = clamped;
  state.playerSquashX = 1.14;
  state.playerSquashY = 0.88;
  return true;
}

export function requestFire(state: GameState): void {
  if (state.phase !== 'playing') return;
  // Input buffer window (0.12s) so slightly early Space/Click fires on first legal frame
  state.fireBufferTimer = 0.12;
}

export function chooseEnemyArchetype(wave: number, spawnIdx: number): EnemyArchetype {
  if (wave === 1) {
    return spawnIdx % 3 === 2 ? 'orbiter' : 'dart';
  }
  if (wave === 2) {
    if (spawnIdx % 4 === 3) return 'colossus';
    return spawnIdx % 2 === 0 ? 'dart' : 'orbiter';
  }
  const mod = spawnIdx % 5;
  if (mod === 4 || (wave >= 4 && mod === 1)) return 'colossus';
  if (mod === 2 || mod === 3) return 'orbiter';
  return 'dart';
}

export function spawnEnemy(state: GameState, forcedArchetype?: EnemyArchetype, forcedLane?: number): EnemyEntity {
  const archetype = forcedArchetype ?? chooseEnemyArchetype(state.wave, state.waveSpawned);
  const lane = forcedLane ?? ((state.waveSpawned * 3 + state.wave) % LANE_CENTERS.length);
  const baseX = LANE_CENTERS[lane];

  const speedScale = 1 + (state.wave - 1) * 0.14;
  let hp = 1;
  let vy = 0.115 * speedScale;
  let radius = 0.036;
  let color = '#F59E0B';

  if (archetype === 'colossus') {
    hp = state.wave >= 4 ? 3 : 2;
    vy = 0.068 * speedScale;
    radius = 0.048;
    color = '#DC2626';
  } else if (archetype === 'orbiter') {
    hp = 1;
    vy = 0.095 * speedScale;
    radius = 0.038;
    color = '#0D9488';
  }

  const tags = ARCHETYPE_TAGS[archetype];
  const entity: EnemyEntity = {
    id: state.nextEntityId++,
    archetype,
    lane,
    x: baseX,
    baseX,
    y: -0.05,
    vy,
    hp,
    maxHp: hp,
    radius,
    label: tags[state.waveSpawned % tags.length],
    color,
    age: 0,
    hitFlashTimer: 0,
    telegraphTimer: 0,
    telegraphTriggered: false,
    dying: false,
    deathTimer: 0,
  };

  state.enemies.push(entity);
  state.waveSpawned += 1;
  return entity;
}

export function answerActiveQuestion(
  state: GameState,
  selectedOptionIndex: number
): { correct: boolean; explanation: string; clearedCount: number } {
  if (state.phase !== 'playing' || !state.activeQuestion) {
    return { correct: false, explanation: '', clearedCount: 0 };
  }

  const q = state.activeQuestion;
  const correct = selectedOptionIndex === q.correctIndex;
  state.questionsAnswered += 1;

  let clearedCount = 0;
  if (correct) {
    state.questionsCorrect += 1;
    state.combo += 2;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.score += 180 + state.combo * 25;
    state.bestScore = Math.max(state.bestScore, state.score);
    state.overdriveCharge = Math.min(100, state.overdriveCharge + 45);
    state.hitstopTimer = 0.055;
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.55);
    state.screenFlashColor = '#10B981';
    state.screenFlashAlpha = 0.24;

    // Starburst clears up to 2 lowest threats immediately!
    const liveEnemies = state.enemies
      .filter((e) => !e.dying)
      .sort((a, b) => b.y - a.y);

    for (const enemy of liveEnemies.slice(0, 2)) {
      enemy.hp = 0;
      enemy.dying = true;
      enemy.deathTimer = 0.3;
      enemy.hitFlashTimer = 0.1;
      state.waveKills += 1;
      clearedCount += 1;
      spawnParticles(state, enemy.x, enemy.y, 18, '#10B981', 0.48);
    }

    // Restore 1 shield pip if damaged and charge full
    if (state.overdriveCharge >= 100 && state.hp < state.maxHp) {
      state.hp += 1;
      state.overdriveCharge = 0;
    }

    state.feedbackBanner = {
      text: `Correct! +${180 + state.combo * 25} · ${q.explanation}`,
      tone: 'good',
      timer: 3.4,
    };
  } else {
    state.combo = 0;
    state.overdriveCharge = Math.max(0, state.overdriveCharge - 15);
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.25);
    state.screenFlashColor = '#DC2626';
    state.screenFlashAlpha = 0.18;
    state.feedbackBanner = {
      text: `Answer: ${q.options[q.correctIndex]} — ${q.explanation}`,
      tone: 'bad',
      timer: 3.8,
    };
  }

  // Rotate to next question
  const pool = pickQuestionsForSubject(state.subjectFilter);
  state.questionIndex = (state.questionIndex + 1) % pool.length;
  state.activeQuestion = pool[state.questionIndex];

  return { correct, explanation: q.explanation, clearedCount };
}

export function stepGameSimulation(state: GameState, rawDt: number): GameEvents {
  const events: GameEvents = {
    shotFired: false,
    lightHit: false,
    heavyKill: false,
    telegraphStarted: false,
    shieldDamaged: false,
    waveCleared: false,
    victoryTriggered: false,
    defeatTriggered: false,
  };

  if (state.phase !== 'playing') return events;

  const dt = Math.min(Math.max(rawDt, 0), MAX_SIM_DT);

  // Real-time visual effects continue ticking during hitstop
  state.cameraTrauma = Math.max(0, state.cameraTrauma - dt * 1.9);
  state.screenFlashAlpha = Math.max(0, state.screenFlashAlpha - dt * 1.4);
  if (state.ghostHp > state.hp) {
    state.ghostHp = Math.max(state.hp, state.ghostHp - dt * 1.8);
  } else {
    state.ghostHp = state.hp;
  }
  if (state.feedbackBanner) {
    state.feedbackBanner.timer -= dt;
    if (state.feedbackBanner.timer <= 0) {
      state.feedbackBanner = null;
    }
  }

  // Update particles even during hitstop
  for (let i = 0; i < state.particles.length; i += 1) {
    const p = state.particles[i];
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
  }

  // Defeat beat delay (0.45s) before modal opens
  if (state.defeatDelayTimer > 0) {
    state.defeatDelayTimer -= dt;
    if (state.defeatDelayTimer <= 0) {
      state.phase = 'gameover';
      state.bestScore = Math.max(state.bestScore, state.score);
      events.defeatTriggered = true;
    }
    return events;
  }

  // Hitstop freezes simulation physics briefly on heavy impacts
  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return events;
  }

  state.elapsedTime += dt;

  // Smooth player turret tracking & squash-and-stretch damping
  const targetX = LANE_CENTERS[state.playerLane];
  state.playerX += (targetX - state.playerX) * Math.min(1, dt * 18);
  state.playerSquashX += (1 - state.playerSquashX) * Math.min(1, dt * 14);
  state.playerSquashY += (1 - state.playerSquashY) * Math.min(1, dt * 14);

  // Fire cooldown + input buffer consumption
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  if (state.fireBufferTimer > 0) {
    state.fireBufferTimer = Math.max(0, state.fireBufferTimer - dt);
    if (state.fireCooldown <= 0) {
      state.projectiles.push({
        id: state.nextEntityId++,
        x: state.playerX,
        y: PLAYER_Y - 0.05,
        vy: -0.92,
        alive: true,
      });
      state.fireCooldown = 0.22;
      state.fireBufferTimer = 0;
      state.playerSquashX = 0.86;
      state.playerSquashY = 1.2;
      spawnParticles(state, state.playerX, PLAYER_Y - 0.05, 4, '#FDE68A', 0.18);
      events.shotFired = true;
    }
  }

  // Enemy spawning with multi-knob difficulty ramp & crowd cap
  const activeEnemiesCount = state.enemies.filter((e) => !e.dying).length;
  const maxConcurrent = Math.min(5, 2 + state.wave);
  if (state.waveSpawned < state.waveTargetKills && activeEnemiesCount < maxConcurrent) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy(state);
      const baseInterval = Math.max(0.85, 2.05 - state.wave * 0.22);
      state.spawnTimer = baseInterval;
    }
  }

  // Move projectiles
  for (const proj of state.projectiles) {
    if (!proj.alive) continue;
    proj.y += proj.vy * dt;
    if (proj.y < -0.05) {
      proj.alive = false;
    }
  }

  // Update enemies with 3 distinct movement policies
  for (const enemy of state.enemies) {
    if (enemy.hitFlashTimer > 0) {
      enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
    }
    if (enemy.dying) {
      enemy.deathTimer -= dt;
      enemy.y -= 0.06 * dt;
      continue;
    }

    enemy.age += dt;

    if (enemy.archetype === 'dart') {
      // Policy 1: Direct high-speed lane chaser with mild acceleration
      enemy.y += (enemy.vy + enemy.age * 0.012) * dt;
      enemy.x = enemy.baseX;
    } else if (enemy.archetype === 'orbiter') {
      // Policy 2: Sinusoidal flanker weaving laterally across lane edges
      enemy.y += enemy.vy * dt;
      enemy.x = Math.max(
        0.1,
        Math.min(0.9, enemy.baseX + Math.sin(enemy.age * 3.2) * 0.11)
      );
    } else if (enemy.archetype === 'colossus') {
      // Policy 3: Heavy armored advance with 0.55s lock-on telegraph surge near mid-board
      if (!enemy.telegraphTriggered && enemy.y >= 0.36) {
        enemy.telegraphTriggered = true;
        enemy.telegraphTimer = 0.55;
        events.telegraphStarted = true;
      }
      if (enemy.telegraphTimer > 0) {
        enemy.telegraphTimer = Math.max(0, enemy.telegraphTimer - dt);
        enemy.y += enemy.vy * 0.2 * dt; // slows visibly during windup telegraph
      } else if (enemy.telegraphTriggered) {
        enemy.y += enemy.vy * 1.85 * dt; // dashes after telegraph!
      } else {
        enemy.y += enemy.vy * dt;
      }
    }

    // Projectile collision checks
    for (const proj of state.projectiles) {
      if (!proj.alive || enemy.dying) continue;
      const dx = proj.x - enemy.x;
      const dy = proj.y - enemy.y;
      const hitDist = enemy.radius + 0.024;
      if (dx * dx + dy * dy <= hitDist * hitDist) {
        proj.alive = false;
        enemy.hp -= 1;
        enemy.hitFlashTimer = 0.06;
        if (enemy.hp <= 0) {
          enemy.dying = true;
          enemy.deathTimer = 0.28;
          state.combo += 1;
          state.maxCombo = Math.max(state.maxCombo, state.combo);
          const pts = enemy.archetype === 'colossus' ? 140 : enemy.archetype === 'orbiter' ? 90 : 60;
          state.score += pts + state.combo * 10;
          state.bestScore = Math.max(state.bestScore, state.score);
          state.waveKills += 1;
          state.overdriveCharge = Math.min(100, state.overdriveCharge + 10);
          const isHeavy = enemy.archetype === 'colossus';
          if (isHeavy) {
            state.hitstopTimer = 0.045;
            state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.42);
            spawnParticles(state, enemy.x, enemy.y, 20, '#F59E0B', 0.45);
            events.heavyKill = true;
          } else {
            state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.16);
            spawnParticles(state, enemy.x, enemy.y, 10, enemy.color, 0.32);
            events.lightHit = true;
          }
        } else {
          // Armored hit knockback
          enemy.y = Math.max(0, enemy.y - 0.03);
          spawnParticles(state, proj.x, proj.y, 6, '#FDE68A', 0.25);
          events.lightHit = true;
        }
      }
    }

    // Check shield breach (reachable loss condition!)
    if (!enemy.dying && enemy.y >= PLAYER_Y - 0.02) {
      enemy.dying = true;
      enemy.deathTimer = 0.2;
      const damage = enemy.archetype === 'colossus' ? 2 : 1;
      state.hp = Math.max(0, state.hp - damage);
      state.combo = 0;
      state.hitstopTimer = 0.055;
      state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.65);
      state.screenFlashColor = '#DC2626';
      state.screenFlashAlpha = 0.3;
      spawnParticles(state, enemy.x, PLAYER_Y, 18, '#DC2626', 0.45);
      events.shieldDamaged = true;

      if (state.hp <= 0) {
        state.defeatDelayTimer = 0.45;
      } else {
        // Count escaped enemy toward wave resolution so wave doesn't soft-lock
        state.waveKills += 1;
      }
    }
  }

  // Cleanup dead projectiles & finished KO animations
  state.projectiles = state.projectiles.filter((p) => p.alive);
  state.enemies = state.enemies.filter((e) => !(e.dying && e.deathTimer <= 0));

  // Wave progression & Victory condition
  if (
    state.hp > 0 &&
    state.defeatDelayTimer <= 0 &&
    state.waveSpawned >= state.waveTargetKills &&
    state.enemies.filter((e) => !e.dying).length === 0
  ) {
    if (state.wave >= state.maxWaves) {
      state.phase = 'victory';
      state.score += state.hp * 150;
      state.bestScore = Math.max(state.bestScore, state.score);
      events.victoryTriggered = true;
    } else {
      state.wave += 1;
      state.waveSpawned = 0;
      state.waveKills = 0;
      state.waveTargetKills = 5 + state.wave * 2;
      state.spawnTimer = 1.2;
      state.feedbackBanner = {
        text: `Wave ${state.wave} of ${state.maxWaves} — Pre-Board Intensity Rising`,
        tone: 'info',
        timer: 2.6,
      };
      events.waveCleared = true;
    }
  }

  return events;
}
