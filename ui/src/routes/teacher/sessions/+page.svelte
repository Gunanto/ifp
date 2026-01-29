<svelte:head>
  <title>Kelola Sesi</title>
</svelte:head>

<main class="page">
  <header class="header">
    <div>
      <p class="eyebrow">Teacher</p>
      <h1>Kelola Sesi</h1>
    </div>
    <a class="back" href="/">← Kembali</a>
  </header>

  <section class="card">
    <h2>Buat Sesi</h2>
    {#if !isAuthed}
      <p class="muted">Belum login. <a href="/teacher/login">Masuk di sini</a>.</p>
    {/if}
    <form class="form" on:submit|preventDefault={saveSession}>
      <input placeholder="Nama sesi" bind:value={form.name} required />
      <select bind:value={form.gameType}>
        <option value="mixed">mixed</option>
        <option value="algebra">algebra</option>
        <option value="geometry">geometry</option>
        <option value="fractions">fractions</option>
        <option value="logic">logic</option>
      </select>
      <input type="number" min="1" max="5" placeholder="Difficulty" bind:value={form.difficulty} />
      <input type="number" min="10" max="600" placeholder="Time limit (s)" bind:value={form.timeLimit} />
      <input type="number" min="1" max="50" placeholder="Jumlah soal" bind:value={form.questionCount} />
      <button class="btn" type="submit" disabled={saving}>Simpan</button>
    </form>
  </section>

  <section class="card">
    <div class="card-header">
      <h2>Daftar Sesi</h2>
      <button class="ghost" on:click={loadSessions} disabled={loading}>
        {loading ? "Memuat..." : "Refresh"}
      </button>
    </div>
    {#if error}
      <p class="error">{error}</p>
    {:else if sessions.length === 0}
      <p class="muted">Belum ada sesi.</p>
    {:else}
      <div class="list">
        {#each sessions as session}
          <article class="item">
            <div>
              <p class="label">Nama</p>
              <p class="value">{session.name}</p>
            </div>
            <div>
              <p class="label">Kode</p>
              <p class="value">{session.code}</p>
            </div>
            <div>
              <p class="label">Tipe</p>
              <p class="value">{session.gameType}</p>
            </div>
            <div>
              <p class="label">Status</p>
              <p class="value">{session.status}</p>
            </div>
            <div class="actions">
              <button class="ghost" on:click={() => editSession(session)}>Edit</button>
              <button class="danger" on:click={() => deleteSession(session.id)}>Hapus</button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</main>

<script lang="ts">
  import { onMount } from "svelte";

  const API_BASE = "http://localhost:3001";
  const TOKEN_KEY = "teacherToken";

  type SessionRow = {
    id: string;
    code: string;
    name: string;
    gameType: string;
    difficulty: number | null;
    status: string | null;
  };

  let sessions: SessionRow[] = [];
  let loading = false;
  let saving = false;
  let error = "";
  let isAuthed = false;

  let form = {
    name: "",
    gameType: "mixed",
    difficulty: 3,
    timeLimit: 60,
    questionCount: 10,
  };
  let editingId: string | null = null;

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  async function loadSessions() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/teacher/sessions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal memuat sesi");
      sessions = data.sessions ?? [];
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading = false;
    }
  }

  async function saveSession() {
    saving = true;
    error = "";
    try {
      const res = await fetch(
        `${API_BASE}/api/teacher/sessions${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal menyimpan");
      editingId = null;
      form = {
        name: "",
        gameType: "mixed",
        difficulty: 3,
        timeLimit: 60,
        questionCount: 10,
      };
      await loadSessions();
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      saving = false;
    }
  }

  function editSession(session: SessionRow) {
    editingId = session.id;
    form = {
      name: session.name,
      gameType: session.gameType,
      difficulty: session.difficulty ?? 3,
      timeLimit: 60,
      questionCount: 10,
    };
  }

  async function deleteSession(id: string) {
    if (!confirm("Hapus sesi ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/teacher/sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal menghapus");
      await loadSessions();
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    }
  }

  async function checkAuth() {
    const token = getToken();
    if (!token) {
      isAuthed = false;
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      isAuthed = res.ok;
    } catch {
      isAuthed = false;
    }
  }

  onMount(async () => {
    await checkAuth();
    if (isAuthed) {
      await loadSessions();
    }
  });
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
    background: #f5f2ea;
    color: #1f1d1b;
  }

  .page {
    max-width: 920px;
    margin: 0 auto;
    padding: 48px 20px 80px;
    display: grid;
    gap: 24px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .eyebrow {
    font-size: 0.8rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #8a6d3b;
    margin: 0 0 6px;
  }

  .back {
    text-decoration: none;
    color: #1f1d1b;
    font-weight: 600;
  }

  .card {
    background: #fff;
    border-radius: 18px;
    padding: 20px;
    border: 1px solid rgba(31, 29, 27, 0.08);
    box-shadow: 0 20px 40px rgba(35, 31, 27, 0.08);
  }

  .form {
    display: grid;
    gap: 12px;
  }


  input,
  select {
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
    background: transparent;
    border: 1px solid rgba(31, 29, 27, 0.2);
    border-radius: 999px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
  }

  .danger {
    background: #fee2e2;
    color: #7f1d1d;
    border: none;
    border-radius: 999px;
    padding: 8px 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .list {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .item {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    padding: 14px;
    border-radius: 14px;
    background: #f8f5ef;
    border: 1px solid rgba(31, 29, 27, 0.08);
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .label {
    margin: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #7c6b58;
  }

  .value {
    margin: 4px 0 0;
    font-weight: 600;
  }

  .muted {
    color: #6d655c;
  }

  .error {
    color: #b1311a;
    background: #fff2ef;
    border-radius: 10px;
    padding: 10px 12px;
  }
</style>
