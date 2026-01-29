<svelte:head>
  <title>Teacher Login</title>
</svelte:head>

<main class="page">
  <header class="header">
    <div>
      <p class="eyebrow">Teacher</p>
      <h1>Masuk</h1>
    </div>
    <a class="back" href="/">← Kembali</a>
  </header>

  <section class="card">
    <h2>Login</h2>
    <form class="form" on:submit|preventDefault={login}>
      <input type="email" placeholder="Email" bind:value={email} required />
      <input type="password" placeholder="Password" bind:value={password} required />
      <button class="btn" type="submit" disabled={loading}>Masuk</button>
    </form>
    {#if error}
      <p class="error">{error}</p>
    {/if}
  </section>

  <section class="card">
    <h2>Daftar Teacher (dev)</h2>
    <form class="form" on:submit|preventDefault={register}>
      <input type="text" placeholder="Nama" bind:value={regName} required />
      <input type="email" placeholder="Email" bind:value={regEmail} required />
      <input type="password" placeholder="Password" bind:value={regPassword} required />
      <button class="ghost" type="submit" disabled={loading}>Daftar</button>
    </form>
  </section>
</main>

<script lang="ts">
  import { goto } from "$app/navigation";

  const API_BASE = "http://localhost:3001";
  const TOKEN_KEY = "teacherToken";

  let email = "";
  let password = "";
  let regName = "";
  let regEmail = "";
  let regPassword = "";
  let error = "";
  let loading = false;

  async function login() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login gagal");
      localStorage.setItem(TOKEN_KEY, data.token);
      await goto("/teacher/questions");
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading = false;
    }
  }

  async function register() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/auth/register-teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          name: regName,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Registrasi gagal");
      email = regEmail;
      password = regPassword;
      await login();
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading = false;
    }
  }
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
    background: #f5f2ea;
    color: #1f1d1b;
  }

  .page {
    max-width: 760px;
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
    background: transparent;
    border: 1px solid rgba(31, 29, 27, 0.2);
    border-radius: 999px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
  }

  .error {
    color: #b1311a;
    background: #fff2ef;
    border-radius: 10px;
    padding: 10px 12px;
  }
</style>
