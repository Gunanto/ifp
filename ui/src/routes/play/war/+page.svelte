<svelte:head>
  <title>Mode Perang</title>
</svelte:head>

<main class="page">
  {#if view === "lobby"}
    <section class="card">
      <a class="back" href="/play">← Kembali ke Latihan</a>
      <h1>Mode Perang</h1>
      <p class="muted">
        Buat room atau gabung dengan kode. 2 pemain, soal berbeda, damage sesuai difficulty.
      </p>
      <div class="form">
        <input placeholder="Nama pemain" bind:value={name} />
        <div class="row">
          <button class="btn" on:click={createRoom} disabled={loading || !name}>
            Buat Room
          </button>
          <div class="join">
            <input placeholder="Kode room" bind:value={roomCode} />
            <button class="ghost" on:click={joinRoom} disabled={loading || !roomCode || !name}>
              Gabung
            </button>
          </div>
        </div>
        {#if error}
          <p class="error">{error}</p>
        {/if}
      </div>
    </section>
  {:else}
    <section class="arena">
      <a class="back" href="/play">← Kembali ke Latihan</a>
      <div class="top-bar">
        <div class="team-card">
          <p class="team">{self?.team === "alpha" ? "TIM ALPHA" : "TIM BRAVO"}</p>
          <p class="hp">{self?.hp ?? 0} HP</p>
          <p class="score">Skor {self?.score ?? 0}</p>
        </div>
        <div class="room-info">
          <p class="code">ROOM {roomCode}</p>
          <p class="timer">{timeLeft}s</p>
          {#if state?.winner}
            <p class="winner">Pemenang: {state.winner.toUpperCase()}</p>
          {:else}
            <p class="status">{statusLabel}</p>
          {/if}
        </div>
        <div class="team-card right">
          <p class="team">{opponent?.team === "alpha" ? "TIM ALPHA" : "TIM BRAVO"}</p>
          <p class="hp">{opponent?.hp ?? 0} HP</p>
          <p class="score">Skor {opponent?.score ?? 0}</p>
        </div>
      </div>

      <div class="battlefield">
        <div class={`soldier left ${hitSide === "left" ? "hit" : ""}`}>🪖</div>
        <div class={`soldier right ${hitSide === "right" ? "hit" : ""}`}>🪖</div>
        <div class={`shot ${shotDirection}`}></div>
        <div class={`hit-flash ${hitSide}`}></div>
        <div class="particles">
          {#each particles as particle (particle.id)}
            <span
              class={`particle ${particle.side}`}
              style={`--x:${particle.x}%; --y:${particle.y}%; --delay:${particle.delay}ms;`}
            ></span>
          {/each}
        </div>
      </div>

      <div class="panel">
        <div class="question">
          <p class="label">Soal kamu (Lv {currentQuestion?.difficulty ?? "-"})</p>
          <p class="text">{currentQuestion?.text ?? "Menunggu lawan..."}</p>
        </div>
        <div class="input-row">
          <input
            placeholder="Jawaban..."
            bind:value={answer}
            disabled={!canAnswer}
            on:keydown={(e) => e.key === "Enter" && submitAnswer()}
          />
          <button class="btn" on:click={submitAnswer} disabled={!canAnswer}>
            OK
          </button>
        </div>
        <div class="keypad">
          {#each keypad as key}
            <button class="key" on:click={() => pressKey(key)}>{key}</button>
          {/each}
          <button class="key ghost" on:click={backspace}>⌫</button>
          <button class="key danger" on:click={clearAnswer}>C</button>
        </div>
        {#if feedback}
          <p class={`feedback ${feedbackOk ? "ok" : "bad"}`}>{feedback}</p>
        {/if}
      </div>

      <section class="card leaderboard">
        <div class="card-header">
          <h2>Leaderboard</h2>
          <div class="leader-controls">
            <div class="tabs">
              <button
                class={`tab ${leaderScope === "global" ? "active" : ""}`}
                on:click={() => setScope("global")}
              >
                Global
              </button>
              <button
                class={`tab ${leaderScope === "room" ? "active" : ""}`}
                on:click={() => setScope("room")}
              >
                Per-Room
              </button>
            </div>
            <select bind:value={leaderPeriod} on:change={loadLeaderboard}>
              <option value="all">Semua</option>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
            </select>
            {#if leaderScope === "room"}
              <input
                class="room-filter"
                placeholder="Filter room code"
                bind:value={leaderRoom}
                on:change={loadLeaderboard}
              />
            {/if}
            <button class="ghost" on:click={loadLeaderboard}>Refresh</button>
          </div>
        </div>
        {#if leaderboard.length === 0}
          <p class="muted">Belum ada data.</p>
        {:else}
          <div class="leader-list">
            {#each leaderboard as row}
              <div class="leader-row">
                <div>
                  <p class="label">{row.playerName}</p>
                  <p class="value">Skor {row.score}</p>
                </div>
                <div>
                  <p class="label">Team</p>
                  <p class="value">{row.team}</p>
                </div>
                <div>
                  <p class="label">HP</p>
                  <p class="value">{row.hpLeft}</p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card settings">
        <div class="card-header">
          <h2>Audio</h2>
        </div>
        <div class="audio-controls">
          <label class="toggle">
            <input type="checkbox" bind:checked={isMuted} />
            <span>Mute</span>
          </label>
          <label class="volume">
            Volume
            <input type="range" min="0" max="1" step="0.05" bind:value={volume} />
            <span>{Math.round(volume * 100)}%</span>
          </label>
          <label class="toggle">
            <input type="checkbox" bind:checked={ambienceOn} on:change={updateAmbience} />
            <span>Ambience</span>
          </label>
          <label class="preset">
            Ambience preset
            <select bind:value={ambiencePreset} on:change={updateAmbience}>
              <option value="desert">Desert</option>
              <option value="battle">Battle</option>
            </select>
          </label>
          <button class="ghost" on:click={resetAudio}>Reset Audio</button>
        </div>
      </section>

      <section class="card settings">
        <div class="card-header">
          <h2>Effects</h2>
        </div>
        <div class="audio-controls">
          <label class="volume">
            Threshold ledakan
            <input type="range" min="8" max="64" step="2" bind:value={bigDamageThreshold} />
            <span>{bigDamageThreshold}</span>
          </label>
          <button class="ghost" on:click={resetEffects}>Reset Effects</button>
        </div>
      </section>
    </section>
  {/if}
</main>

<script lang="ts">
  import { onDestroy } from "svelte";

  const API_BASE = "http://localhost:3001";
  const POLL_MS = 1000;

  type Player = {
    id: string;
    name: string;
    team: "alpha" | "bravo";
    hp: number;
    score: number;
    difficulty: number;
    cooldownUntil?: number;
  };

  type Question = {
    id: string;
    text: string;
    difficulty: number;
    expiresAt: number;
  };

  type RoomState = {
    players: Player[];
    questions: Record<string, Question>;
    winner?: "alpha" | "bravo" | null;
  };

  type LeaderRow = {
    id: string;
    playerName: string;
    team: string;
    score: number;
    hpLeft: number;
  };

  let view: "lobby" | "game" = "lobby";
  let name = "";
  let roomCode = "";
  let playerId = "";
  let state: RoomState | null = null;
  let settings: { timePerQuestion: number; baseHp: number; damagePerDifficulty: number } | null =
    null;
  let loading = false;
  let error = "";
  let polling: number | null = null;
  let serverTime = Date.now();
  let timeLeft = 0;
  let answer = "";
  let feedback = "";
  let feedbackOk = false;
  let shotDirection: "left" | "right" | "none" = "none";
  let leaderboard: LeaderRow[] = [];
  let leaderPeriod: "all" | "daily" | "weekly" = "all";
  let leaderRoom = "";
  let leaderScope: "global" | "room" = "global";
  let hitSide: "left" | "right" | "none" = "none";
  let isMuted = false;
  let volume = 0.6;
  let ambienceOn = false;
  let ambiencePreset: "battle" | "desert" = "desert";
  let ambienceNode: { ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null = null;
  let particles: Array<{ id: string; side: "left" | "right"; x: number; y: number; delay: number }> = [];
  let bigDamageThreshold = 24;
  const SETTINGS_KEY = "warSettings";
  const DEFAULT_SETTINGS = {
    isMuted: false,
    volume: 0.6,
    ambienceOn: false,
    ambiencePreset: "desert" as "desert" | "battle",
    bigDamageThreshold: 24,
  };

  const keypad = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "-", "/"];

  $: self = state?.players.find((p) => p.id === playerId);
  $: opponent = state?.players.find((p) => p.id !== playerId);
  $: currentQuestion = state?.questions[playerId];
  $: statusLabel =
    state?.winner
      ? "Selesai"
      : state?.players.length === 2
        ? "Bertanding"
        : "Menunggu lawan";
  $: canAnswer =
    !!currentQuestion &&
    !!self &&
    (!self.cooldownUntil || serverTime >= self.cooldownUntil) &&
    view === "game";

  function startPolling() {
    stopPolling();
    polling = window.setInterval(loadState, POLL_MS);
  }

  function stopPolling() {
    if (polling !== null) {
      clearInterval(polling);
      polling = null;
    }
  }

  async function loadLeaderboard() {
    try {
      const res = await fetch(
        `${API_BASE}/api/war/leaderboard?limit=10&period=${leaderPeriod}&room=${leaderRoom}&scope=${leaderScope}`,
      );
      const data = await res.json();
      if (res.ok) {
        leaderboard = data.leaderboard ?? [];
      }
    } catch {
      // ignore
    }
  }

  async function createRoom() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/war/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal membuat room");
      roomCode = data.code;
      playerId = data.playerId;
      settings = data.settings;
      view = "game";
      await loadState();
      startPolling();
      await loadLeaderboard();
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading = false;
    }
  }

  async function joinRoom() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/war/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal gabung room");
      playerId = data.playerId;
      settings = data.settings;
      view = "game";
      await loadState();
      startPolling();
      await loadLeaderboard();
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading = false;
    }
  }

  async function loadState() {
    if (!roomCode) return;
    try {
      const res = await fetch(`${API_BASE}/api/war/rooms/${roomCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal load");
      state = data.state;
      settings = data.settings;
      serverTime = data.serverTime;
      const q = data.state?.questions?.[playerId];
      timeLeft = q ? Math.max(0, Math.ceil((q.expiresAt - serverTime) / 1000)) : 0;
      if (data.state?.winner) {
        stopPolling();
      }
    } catch (err) {
      feedback = err instanceof Error ? err.message : "Gagal update";
      feedbackOk = false;
    }
  }

  function pressKey(key: string) {
    if (!canAnswer) return;
    answer = `${answer}${key}`;
  }

  function backspace() {
    if (!canAnswer) return;
    answer = answer.slice(0, -1);
  }

  function clearAnswer() {
    if (!canAnswer) return;
    answer = "";
  }

  async function submitAnswer() {
    if (!canAnswer || !currentQuestion) return;
    feedback = "";
    try {
      const res = await fetch(`${API_BASE}/api/war/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: roomCode, playerId, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal submit");
      feedbackOk = data.correct;
      if (data.correct) {
        shotDirection = self?.team === "alpha" ? "left" : "right";
        hitSide = self?.team === "alpha" ? "right" : "left";
        playSound("correct");
        setTimeout(() => (shotDirection = "none"), 600);
        setTimeout(() => (hitSide = "none"), 500);
        if (data.damage >= bigDamageThreshold) {
          triggerExplosion(hitSide === "left" ? "left" : "right");
        }
      } else {
        playSound("wrong");
      }
      feedback = data.correct
        ? `Benar! Damage ${data.damage}`
        : data.reason === "timeout"
          ? "Waktu habis!"
          : "Salah, cooldown aktif";
      answer = "";
      state = data.state ?? state;
      serverTime = data.serverTime ?? Date.now();
      const q = state?.questions?.[playerId];
      timeLeft = q ? Math.max(0, Math.ceil((q.expiresAt - serverTime) / 1000)) : 0;
    } catch (err) {
      feedback = err instanceof Error ? err.message : "Gagal submit";
      feedbackOk = false;
      playSound("wrong");
    }
  }

  function playSound(type: "correct" | "wrong") {
    if (isMuted || volume <= 0) return;
    try {
      const AudioContext =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: any }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = type === "correct" ? "triangle" : "sawtooth";
      oscillator.frequency.value = type === "correct" ? 740 : 180;
      gain.gain.value = 0.05 * volume;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, type === "correct" ? 180 : 260);
    } catch {
      // ignore audio errors
    }
  }

  function triggerExplosion(side: "left" | "right") {
    const idBase = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const burst = Array.from({ length: 14 }).map((_, i) => ({
      id: `${idBase}_${i}`,
      side,
      x: side === "left" ? 20 + Math.random() * 15 : 65 + Math.random() * 15,
      y: 40 + Math.random() * 20,
      delay: Math.floor(Math.random() * 120),
    }));
    particles = [...particles, ...burst];
    setTimeout(() => {
      const ids = new Set(burst.map((b) => b.id));
      particles = particles.filter((p) => !ids.has(p.id));
    }, 900);
  }

  function updateAmbience() {
    if (typeof window === "undefined") return;
    if (ambienceOn && !isMuted && volume > 0) {
      if (ambienceNode) {
        ambienceNode.gain.gain.value = 0.02 * volume;
        ambienceNode.osc.frequency.value = ambiencePreset === "battle" ? 90 : 110;
        return;
      }
      const AudioContext =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: any }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = ambiencePreset === "battle" ? "sawtooth" : "sine";
      osc.frequency.value = ambiencePreset === "battle" ? 90 : 110;
      gain.gain.value = 0.02 * volume;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ambienceNode = { ctx, osc, gain };
    } else if (ambienceNode) {
      ambienceNode.osc.stop();
      ambienceNode.ctx.close();
      ambienceNode = null;
    }
  }

  function setScope(scope: "global" | "room") {
    leaderScope = scope;
    if (scope === "global") {
      leaderRoom = "";
    }
    loadLeaderboard();
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        isMuted?: boolean;
        volume?: number;
        ambienceOn?: boolean;
        ambiencePreset?: "battle" | "desert";
        bigDamageThreshold?: number;
      };
      if (typeof data.isMuted === "boolean") isMuted = data.isMuted;
      if (typeof data.volume === "number") volume = data.volume;
      if (typeof data.ambienceOn === "boolean") ambienceOn = data.ambienceOn;
      if (data.ambiencePreset === "battle" || data.ambiencePreset === "desert") {
        ambiencePreset = data.ambiencePreset;
      }
      if (typeof data.bigDamageThreshold === "number") {
        bigDamageThreshold = data.bigDamageThreshold;
      }
    } catch {
      // ignore
    }
  }

  function saveSettings() {
    const payload = {
      isMuted,
      volume,
      ambienceOn,
      ambiencePreset,
      bigDamageThreshold,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  }

  function resetAudio() {
    isMuted = DEFAULT_SETTINGS.isMuted;
    volume = DEFAULT_SETTINGS.volume;
    ambienceOn = DEFAULT_SETTINGS.ambienceOn;
    ambiencePreset = DEFAULT_SETTINGS.ambiencePreset;
    saveSettings();
  }

  function resetEffects() {
    bigDamageThreshold = DEFAULT_SETTINGS.bigDamageThreshold;
    saveSettings();
  }

  $: updateAmbience();
  $: saveSettings();

  onDestroy(() => {
    stopPolling();
    if (ambienceNode) {
      ambienceNode.osc.stop();
      ambienceNode.ctx.close();
    }
  });

  onMount(() => {
    loadSettings();
  });
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
    background: #f6e3b3;
    color: #1f1d1b;
  }

  .page {
    min-height: 100vh;
    padding: 32px 20px 48px;
  }

  .card {
    max-width: 680px;
    margin: 0 auto;
    background: #fff;
    border-radius: 20px;
    padding: 24px;
    border: 1px solid rgba(31, 29, 27, 0.1);
    box-shadow: 0 24px 60px rgba(35, 31, 27, 0.12);
  }

  .back {
    display: inline-block;
    margin-bottom: 12px;
    text-decoration: none;
    color: #1f1d1b;
    font-weight: 600;
  }

  .form {
    display: grid;
    gap: 12px;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .join {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  input {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(31, 29, 27, 0.2);
    font-size: 1rem;
  }

  .btn {
    background: #1f1d1b;
    color: #f8f5ef;
    border: none;
    border-radius: 999px;
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
  }

  .ghost {
    background: #fff;
    border: 1px solid rgba(31, 29, 27, 0.2);
    border-radius: 999px;
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
  }

  .arena {
    display: grid;
    gap: 16px;
  }

  .top-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: center;
  }

  .team-card {
    background: #fff;
    border-radius: 16px;
    padding: 12px 16px;
    border: 1px solid rgba(31, 29, 27, 0.1);
    box-shadow: 0 12px 30px rgba(35, 31, 27, 0.1);
  }

  .team-card.right {
    text-align: right;
  }

  .team {
    font-weight: 700;
    margin: 0;
    color: #f97316;
  }

  .hp {
    margin: 4px 0 0;
    font-size: 1.2rem;
  }

  .score {
    margin: 0;
    color: #6d655c;
  }

  .room-info {
    text-align: center;
  }

  .code {
    font-weight: 700;
    letter-spacing: 0.2em;
    margin: 0;
  }

  .timer {
    font-size: 1.6rem;
    margin: 6px 0 0;
  }

  .winner {
    margin: 6px 0 0;
    font-weight: 700;
    color: #15803d;
  }

  .status {
    margin: 6px 0 0;
    color: #6d655c;
  }

  .battlefield {
    height: 220px;
    border-radius: 24px;
    background: linear-gradient(180deg, #98c5df 0%, #e7c27b 55%, #dca44d 100%);
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(31, 29, 27, 0.1);
  }

  .shot {
    position: absolute;
    top: 50%;
    width: 16px;
    height: 6px;
    background: #f97316;
    border-radius: 999px;
    opacity: 0;
  }

  .hit-flash {
    position: absolute;
    inset: 0;
    border-radius: 24px;
    opacity: 0;
    pointer-events: none;
  }

  .hit-flash.left {
    animation: flash-left 0.45s ease-out;
  }

  .hit-flash.right {
    animation: flash-right 0.45s ease-out;
  }

  .shot.left {
    animation: shot-left 0.55s ease-out;
  }

  .shot.right {
    animation: shot-right 0.55s ease-out;
  }

  .soldier {
    position: absolute;
    bottom: 16px;
    font-size: 3rem;
  }

  .soldier.hit {
    animation: hit-shake 0.4s ease-in-out;
  }

  .soldier.left {
    left: 24px;
  }

  .soldier.right {
    right: 24px;
    transform: scaleX(-1);
  }

  .panel {
    background: #fff;
    border-radius: 20px;
    padding: 18px;
    border: 1px solid rgba(31, 29, 27, 0.1);
    max-width: 640px;
  }

  .question {
    margin-bottom: 12px;
  }

  .label {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.75rem;
    color: #8a6d3b;
    margin: 0 0 6px;
  }

  .text {
    margin: 0;
    font-size: 1.4rem;
  }

  .input-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .keypad {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
  }

  .key {
    border-radius: 12px;
    padding: 10px 0;
    border: 1px solid rgba(31, 29, 27, 0.1);
    background: #fef3c7;
    font-weight: 700;
  }

  .key.ghost {
    background: #fff;
  }

  .key.danger {
    background: #fee2e2;
  }

  .muted {
    color: #6d655c;
  }

  .error {
    color: #b1311a;
    background: #fff2ef;
    padding: 8px 12px;
    border-radius: 10px;
  }

  .feedback {
    margin-top: 10px;
    font-weight: 600;
  }

  .feedback.ok {
    color: #15803d;
  }

  .feedback.bad {
    color: #b91c1c;
  }

  .leaderboard {
    margin-top: 12px;
  }

  .leader-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .tabs {
    display: flex;
    gap: 6px;
  }

  .tab {
    border: 1px solid rgba(31, 29, 27, 0.2);
    border-radius: 999px;
    padding: 6px 12px;
    background: #fff;
    font-weight: 600;
    cursor: pointer;
  }

  .tab.active {
    background: #1f1d1b;
    color: #f8f5ef;
    border-color: #1f1d1b;
  }

  .leader-controls select {
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(31, 29, 27, 0.2);
    font-weight: 600;
  }

  .room-filter {
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(31, 29, 27, 0.2);
    font-weight: 600;
    min-width: 140px;
  }

  .leader-list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .leader-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fff7ed;
    border: 1px solid rgba(31, 29, 27, 0.08);
  }

  .settings {
    margin-top: 12px;
  }

  .audio-controls {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .toggle {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    font-weight: 600;
  }

  .volume {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .preset {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .volume input[type="range"] {
    flex: 1;
  }

  .particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f97316;
    left: var(--x);
    top: var(--y);
    opacity: 0;
    animation: burst 0.8s ease-out forwards;
    animation-delay: var(--delay);
  }

  @keyframes hit-shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-6px);
    }
    50% {
      transform: translateX(6px);
    }
    75% {
      transform: translateX(-4px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @keyframes flash-left {
    0% {
      opacity: 0.7;
      background: radial-gradient(circle at 20% 50%, rgba(248, 113, 113, 0.6), transparent 60%);
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes flash-right {
    0% {
      opacity: 0.7;
      background: radial-gradient(circle at 80% 50%, rgba(248, 113, 113, 0.6), transparent 60%);
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes burst {
    0% {
      transform: scale(0.6);
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    100% {
      transform: translateY(-20px) scale(1.4);
      opacity: 0;
    }
  }

  @keyframes shot-left {
    0% {
      opacity: 0;
      left: 80px;
      transform: translateY(-50%);
    }
    10% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      left: calc(100% - 80px);
      transform: translateY(-50%);
    }
  }

  @keyframes shot-right {
    0% {
      opacity: 0;
      left: calc(100% - 80px);
      transform: translateY(-50%);
    }
    10% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      left: 80px;
      transform: translateY(-50%);
    }
  }

  @media (max-width: 720px) {
    .row {
      grid-template-columns: 1fr;
    }

    .top-bar {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .team-card.right {
      text-align: center;
    }

    .keypad {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
