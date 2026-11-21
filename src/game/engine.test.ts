import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerActiveQuestion,
  createInitialGameState,
  movePlayerLane,
  requestFire,
  spawnEnemy,
  startNewRun,
  stepGameSimulation,
} from './engine';

test('game survives first 5 seconds cleanly without any player input', () => {
  const state = startNewRun(createInitialGameState());
  for (let i = 0; i < 125; i += 1) {
    stepGameSimulation(state, 0.04); // 5.0 seconds total
  }
  assert.equal(state.phase, 'playing');
  assert.equal(state.hp, state.maxHp);
});

test('three enemy archetypes execute distinct movement and telegraph policies', () => {
  const state = startNewRun(createInitialGameState());
  state.spawnTimer = 999; // manual spawn control

  const dart = spawnEnemy(state, 'dart', 0);
  const orbiter = spawnEnemy(state, 'orbiter', 1);
  const colossus = spawnEnemy(state, 'colossus', 2);

  const initialOrbiterX = orbiter.x;
  let telegraphSeen = false;

  for (let i = 0; i < 190; i += 1) {
    const ev = stepGameSimulation(state, 0.04);
    if (ev.telegraphStarted) telegraphSeen = true;
  }

  assert.equal(dart.x, dart.baseX, 'Dart moves straight down its lane');
  assert.notEqual(orbiter.x, initialOrbiterX, 'Orbiter weaves laterally');
  assert.equal(colossus.maxHp, 2, 'Colossus has armored multi-hit HP');
  assert.equal(telegraphSeen, true, 'Colossus triggers visible windup telegraph');
});

test('shooting eliminates enemies, increments score/combo, and triggers hitstop on colossus', () => {
  const state = startNewRun(createInitialGameState());
  state.spawnTimer = 999;
  movePlayerLane(state, 1); // lane 2
  const colossus = spawnEnemy(state, 'colossus', 2);
  colossus.y = 0.5;
  state.playerX = colossus.x;

  // Fire twice to defeat 2-HP colossus
  requestFire(state);
  stepGameSimulation(state, 0.02);
  for (let i = 0; i < 30; i += 1) stepGameSimulation(state, 0.02);

  requestFire(state);
  let heavyKillSeen = false;
  for (let i = 0; i < 40; i += 1) {
    const ev = stepGameSimulation(state, 0.02);
    if (ev.heavyKill) heavyKillSeen = true;
  }

  assert.equal(heavyKillSeen, true);
  assert.ok(state.score >= 140);
  assert.ok(state.combo >= 1);
});

test('trivia overdrive correct answer clears threats and boosts score', () => {
  const state = startNewRun(createInitialGameState());
  state.spawnTimer = 999;
  spawnEnemy(state, 'dart', 0);
  spawnEnemy(state, 'orbiter', 1);
  assert.ok(state.activeQuestion);

  const result = answerActiveQuestion(state, state.activeQuestion.correctIndex);
  assert.equal(result.correct, true);
  assert.equal(result.clearedCount, 2);
  assert.ok(state.score >= 180);
  assert.equal(state.questionsCorrect, 1);
});

test('loss condition is reachable at 0 HP and victory is reachable after wave 5', () => {
  // Reachable Game Over
  const lossState = startNewRun(createInitialGameState());
  lossState.spawnTimer = 999;
  lossState.hp = 1;
  const threat = spawnEnemy(lossState, 'dart', 0);
  threat.y = 0.83;

  for (let i = 0; i < 40; i += 1) {
    stepGameSimulation(lossState, 0.04);
  }
  assert.equal(lossState.hp, 0);
  assert.equal(lossState.phase, 'gameover');

  // Reachable Victory
  const winState = startNewRun(createInitialGameState());
  winState.wave = winState.maxWaves;
  winState.waveSpawned = winState.waveTargetKills;
  winState.enemies = [];
  const ev = stepGameSimulation(winState, 0.02);
  assert.equal(ev.victoryTriggered, true);
  assert.equal(winState.phase, 'victory');
});
