<svelte:head>
  <title>Mathemagic Touch</title>
</svelte:head>

<main class="page">
  <header class="hero">
    <p class="eyebrow">Mathemagic Touch</p>
    <h1>Portal</h1>
    <p class="subhead">Pilih area: siswa/pemain atau teacher.</p>
  </header>

  <section class="grid">
    <a class="card" href="/play">
      <h2>Siswa / Pemain</h2>
      <p>Latihan soal harian dan mode permainan.</p>
    </a>
    <a class="card" href="/play/war">
      <h2>Mode Perang</h2>
      <p>Multiplayer 1v1 dengan damage sesuai difficulty.</p>
    </a>
    <a class="card" href="/teacher/login">
      <h2>Teacher</h2>
      <p>Login dan kelola soal, kelas, sesi.</p>
    </a>
  </section>
</main>

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
    max-width: 920px;
    margin: 0 auto;
    display: grid;
    gap: 28px;
  }

  .hero {
    display: grid;
    gap: 12px;
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
    max-width: 520px;
    color: #5c5348;
  }

  .grid {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .card {
    text-decoration: none;
    color: inherit;
    background: #fff;
    border-radius: 18px;
    padding: 20px;
    border: 1px solid rgba(31, 29, 27, 0.08);
    box-shadow: 0 20px 40px rgba(35, 31, 27, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 24px 60px rgba(35, 31, 27, 0.12);
  }

  h2 {
    margin: 0 0 8px;
  }

  p {
    margin: 0;
    color: #6d655c;
  }
</style>
