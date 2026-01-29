<svelte:head>
  <title>Mathemagic Touch</title>
</svelte:head>

<main class="page">
  <header class="hero">
    <p class="eyebrow">Mathemagic Touch</p>
    <h1>Latihan soal cepat, hasil instan</h1>
    <p class="subhead">
      UI awal ini mengambil soal dari backend dan menampilkannya sebagai daftar.
    </p>
    <nav class="nav">
      <a href="/">Portal</a>
      <a href="/play/war">Mode Perang</a>
    </nav>
  </header>

  <section class="card">
    <div class="card-header">
      <h2>Mode Game</h2>
      <div class="actions">
        <button class="btn" on:click={startGame} disabled={loading}>
          {gameActive ? "Ulangi" : "Mulai Game"}
        </button>
        <button class="ghost" on:click={finishGame} disabled={!sessionId || loading}>
          Selesai
        </button>
        <button class="ghost" on:click={refresh} disabled={loading || gameActive}>
          {loading ? "Memuat..." : "Ambil Soal"}
        </button>
      </div>
    </div>

    {#if error}
      <p class="error">{error}</p>
    {:else if loading && questions.length === 0}
      <p class="muted">Mengambil soal dari server…</p>
    {:else}
      <div class="game-grid">
        <div class="scoreboard">
          <div>
            <p class="label">Waktu</p>
            <p class="value">{timeLeft}s</p>
          </div>
          <div>
            <p class="label">Skor</p>
            <p class="value">{score}</p>
          </div>
          <div>
            <p class="label">Soal Terjawab</p>
            <p class="value">{answeredCount}</p>
          </div>
          <div>
            <p class="label">Level</p>
            <p class="value">{difficultyLevel}</p>
          </div>
        </div>

        <div class="prompt">
          {#if !gameActive}
            <p class="muted">Klik "Mulai Game" untuk memulai sesi 60 detik.</p>
          {:else if activeQuestion}
            <div class="prompt-header">
              <span class="topic">{activeQuestion.topic}</span>
              <span class="difficulty">Level {difficultyLevel}</span>
            </div>
            <p class="question-text">{activeQuestion.question}</p>
            <form class="answer" on:submit|preventDefault={submitAnswer}>
              <input
                type="text"
                placeholder="Ketik jawaban..."
                bind:value={answer}
                disabled={!gameActive}
                required
              />
              <button class="btn" type="submit" disabled={!gameActive}>Kirim</button>
            </form>
            {#if feedback}
              <p class={`feedback ${feedbackOk ? "ok" : "bad"}`}>{feedback}</p>
            {:else}
              <p class="hint">Jawaban akan divalidasi server sebelum skor bertambah.</p>
            {/if}
          {:else}
            <p class="muted">Tidak ada soal.</p>
          {/if}
        </div>
      </div>
    {/if}
  </section>

  <section class="card">
    <div class="card-header">
      <h2>Ringkasan Sesi</h2>
    </div>
    {#if sessionSummary}
      <div class="summary">
        <div>
          <p class="label">Skor Akhir</p>
          <p class="value">{sessionSummary.score}</p>
        </div>
        <div>
          <p class="label">Akurasi</p>
          <p class="value">{sessionSummary.accuracy}%</p>
        </div>
        <div>
          <p class="label">Benar</p>
          <p class="value">{sessionSummary.correctAnswered}/{sessionSummary.totalAnswered}</p>
        </div>
      </div>
    {:else}
      <p class="muted">Belum ada ringkasan. Selesaikan satu sesi.</p>
    {/if}
  </section>

  <section class="card">
    <div class="card-header">
      <h2>Riwayat Sesi</h2>
    </div>
    {#if history.length === 0}
      <p class="muted">Belum ada riwayat.</p>
    {:else}
      <div class="history">
        {#each history as run}
          <div class="history-item">
            <div>
              <p class="label">Skor</p>
              <p class="value">{run.score}</p>
            </div>
            <div>
              <p class="label">Akurasi</p>
              <p class="value">{run.accuracy}%</p>
            </div>
            <div>
              <p class="label">Status</p>
              <p class="value">{run.status}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="card">
    <div class="card-header">
      <h2>Soal Terkini</h2>
    </div>
    {#if questions.length === 0}
      <p class="muted">Belum ada soal.</p>
    {:else}
      <ol class="questions">
        {#each questions as q}
          <li class="question">
            <div class="meta">
              <span class="topic">{q.topic}</span>
              <span class="difficulty">Level {q.difficulty}</span>
            </div>
            <p class="text">{q.question}</p>
          </li>
        {/each}
      </ol>
    {/if}
  </section>
</main>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  type Question = {
    id: string;
    topic: string;
    difficulty: number;
    question: string;
  };

  type RunSummary = {
    sessionId: string;
    score: number;
    totalAnswered: number;
    correctAnswered: number;
    accuracy: number;
    status: string;
  };

  type RunHistory = {
    id: string;
    score: number | null;
    totalAnswered: number | null;
    correctAnswered: number | null;
    status: string | null;
  };

  const API_BASE = "http://localhost:3001";

  let questions: Question[] = [];
  let loading = false;
  let error = "";
  let gameActive = false;
  let timeLeft = 60;
  let score = 0;
  let answer = "";
  let feedback = "";
  let feedbackOk = false;
  let sessionId = "";
  let activeQuestion: Question | null = null;
  let answeredCount = 0;
  let difficultyLevel = 3;
  let questionStartedAt = 0;
  let sessionSummary: RunSummary | null = null;
  let history: RunSummary[] = [];
  let timer: number | null = null;
  let feedbackTimer: number | null = null;
  let finishing = false;

  async function loadQuestions() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/game/questions`);
      if (!res.ok) {
        throw new Error(`Gagal memuat: ${res.status}`);
      }
      const data = await res.json();
      questions = data.questions ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error = `Tidak bisa ambil data dari backend (${message}).`;
    } finally {
      loading = false;
    }
  }

  function refresh() {
    loadQuestions();
  }

  function stopTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  async function startGame() {
    stopTimer();
    loading = true;
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeLimit: 60 }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gagal memulai game");
      }
      sessionId = data.sessionId;
      activeQuestion = data.question;
      score = data.score ?? 0;
      answeredCount = 0;
      difficultyLevel = data.difficulty ?? 3;
      sessionSummary = null;
      gameActive = true;
      timeLeft = data.timeLimit ?? 60;
      answer = "";
      feedback = "";
      questionStartedAt = performance.now();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error = `Tidak bisa memulai game (${message}).`;
      gameActive = false;
      return;
    } finally {
      loading = false;
    }
    timer = window.setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        timeLeft = 0;
        finishGame();
      }
    }, 1000);
  }

  function submitAnswer() {
    if (!gameActive || !activeQuestion || !sessionId) return;
    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer);
    }
    const spent = Math.max(0, (performance.now() - questionStartedAt) / 1000);
    checkAnswer(activeQuestion.id, answer, spent);
  }

  async function checkAnswer(
    questionId: string,
    userAnswer: string,
    timeSpent: number,
  ) {
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/game/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId,
          answer: userAnswer,
          timeSpent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gagal memvalidasi jawaban");
      }
      feedbackOk = Boolean(data.correct);
      feedback = data.correct
        ? "Benar! +1 poin"
        : `Salah. Jawaban benar: ${data.correctAnswer}`;
      score = data.score ?? score;
      answeredCount = data.totalAnswered ?? answeredCount;
      difficultyLevel = data.difficulty ?? difficultyLevel;
      answer = "";
      feedbackTimer = window.setTimeout(() => {
        feedback = "";
        activeQuestion = data.nextQuestion ?? activeQuestion;
        questionStartedAt = performance.now();
      }, 700);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error = `Validasi gagal (${message}).`;
    }
  }

  onMount(loadQuestions);
  onMount(loadHistory);
  onDestroy(() => {
    stopTimer();
    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer);
    }
  });

  async function finishGame() {
    if (!sessionId || finishing) return;
    finishing = true;
    try {
      const res = await fetch(`${API_BASE}/api/game/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gagal menyelesaikan sesi");
      }
      sessionSummary = data;
      gameActive = false;
      stopTimer();
      await loadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error = `Sesi gagal diselesaikan (${message}).`;
    } finally {
      finishing = false;
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch(`${API_BASE}/api/game/history?limit=8`);
      const data = await res.json();
      if (res.ok) {
        history = (data.runs ?? []).map((run: RunHistory) => {
          const total = run.totalAnswered ?? 0;
          const correct = run.correctAnswered ?? 0;
          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
          return {
            sessionId: run.id,
            score: run.score ?? 0,
            totalAnswered: total,
            correctAnswered: correct,
            accuracy,
            status: run.status ?? "unknown",
          };
        });
      }
    } catch {
      // ignore history errors
    }
  }
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
    background: radial-gradient(circle at top, #f8f5ef 0%, #f1efe8 45%, #e6e2d6 100%);
    color: #1f1d1b;
  }

  .page {
    min-height: 100vh;
    padding: 56px 20px 72px;
    display: grid;
    gap: 32px;
    max-width: 920px;
    margin: 0 auto;
  }

  .hero {
    display: grid;
    gap: 12px;
  }

  .nav {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .nav a {
    color: #1f1d1b;
    text-decoration: none;
    font-weight: 600;
    border-bottom: 2px solid transparent;
    padding-bottom: 4px;
  }

  .nav a:hover {
    border-bottom-color: #8a6d3b;
  }

  .eyebrow {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.25em;
    color: #8a6d3b;
    margin: 0;
  }

  h1 {
    font-size: clamp(2.2rem, 4vw, 3.3rem);
    margin: 0;
  }

  .subhead {
    margin: 0;
    max-width: 540px;
    color: #5c5348;
  }

  .card {
    background: #ffffff;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 24px 60px rgba(35, 31, 27, 0.12);
    border: 1px solid rgba(35, 31, 27, 0.08);
  }

  .card-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .ghost {
    background: transparent;
    border: 1px solid rgba(31, 29, 27, 0.2);
    border-radius: 999px;
    padding: 10px 16px;
    font-weight: 600;
    color: #1f1d1b;
    cursor: pointer;
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .btn {
    background: #1f1d1b;
    color: #f8f5ef;
    border: none;
    border-radius: 999px;
    padding: 10px 18px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .muted {
    color: #6d655c;
  }

  .error {
    color: #b1311a;
    background: #fff2ef;
    border-radius: 12px;
    padding: 12px 16px;
  }

  .questions {
    list-style: none;
    padding: 0;
    margin: 16px 0 0;
    display: grid;
    gap: 12px;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-top: 12px;
    background: #f8f5ef;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgba(31, 29, 27, 0.08);
  }

  .history {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .history-item {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid rgba(31, 29, 27, 0.08);
    background: #f9f7f2;
  }

  .game-grid {
    display: grid;
    gap: 20px;
    margin-top: 12px;
  }

  .scoreboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    background: #f8f5ef;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid rgba(31, 29, 27, 0.08);
  }

  .label {
    margin: 0;
    font-size: 0.8rem;
    color: #7c6b58;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .value {
    margin: 4px 0 0;
    font-size: 1.4rem;
    font-weight: 600;
  }

  .prompt {
    background: #ffffff;
    border-radius: 16px;
    padding: 18px;
    border: 1px solid rgba(31, 29, 27, 0.08);
  }

  .prompt-header {
    display: flex;
    gap: 12px;
    font-size: 0.85rem;
    color: #7c6b58;
    margin-bottom: 8px;
  }

  .question-text {
    margin: 0 0 16px;
    font-size: 1.2rem;
  }

  .answer {
    display: flex;
    gap: 10px;
  }

  .answer input {
    flex: 1;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(31, 29, 27, 0.2);
    font-size: 1rem;
  }

  .hint {
    margin-top: 10px;
    font-size: 0.85rem;
    color: #7c6b58;
  }

  .feedback {
    margin-top: 10px;
    font-size: 0.9rem;
    padding: 8px 12px;
    border-radius: 10px;
  }

  .feedback.ok {
    color: #14532d;
    background: #dcfce7;
  }

  .feedback.bad {
    color: #7f1d1d;
    background: #fee2e2;
  }

  .question {
    border-radius: 14px;
    padding: 16px;
    background: #f8f5ef;
    border: 1px solid rgba(31, 29, 27, 0.08);
  }

  .meta {
    display: flex;
    gap: 12px;
    font-size: 0.85rem;
    color: #7c6b58;
    margin-bottom: 6px;
  }

  .topic {
    text-transform: uppercase;
    letter-spacing: 0.18em;
  }

  .difficulty {
    font-weight: 600;
  }

  .text {
    margin: 0;
    font-size: 1.05rem;
  }

  @media (max-width: 640px) {
    .card {
      padding: 18px;
    }
  }
</style>
