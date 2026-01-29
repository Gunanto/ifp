<svelte:head>
  <title>Kelola Soal</title>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
  />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.css"
  />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/theme/material-darker.min.css"
  />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css"
  />
  <script
    defer
    src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"
  ></script>
  <script
    defer
    src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.js"
  ></script>
  <script
    defer
    src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/stex/stex.min.js"
  ></script>
  <script defer src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
  <script
    defer
    src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-latex.min.js"
  ></script>
</svelte:head>

<main class="page">
  <header class="header">
    <div>
      <p class="eyebrow">Teacher</p>
      <h1>Kelola Soal</h1>
    </div>
    <a class="back" href="/">← Kembali</a>
  </header>

  <section class="card">
    <h2>Buat Soal Baru</h2>
    {#if !isAuthed}
      <p class="muted">Belum login. <a href="/teacher/login">Masuk di sini</a>.</p>
    {/if}
    <form class="form" on:submit|preventDefault={createQuestion}>
      <input placeholder="Topik (mis. algebra)" bind:value={form.topic} required />
      <input placeholder="Sub-topik (mis. linear)" bind:value={form.subTopic} required />
      <div class="row">
        <select bind:value={form.questionFormat}>
          <option value="text">Format soal: teks</option>
          <option value="latex">Format soal: LaTeX</option>
        </select>
        <select bind:value={form.answerFormat}>
          <option value="text">Format jawaban: teks</option>
          <option value="latex">Format jawaban: LaTeX</option>
        </select>
      </div>
      <div class="toolbar">
        <div class="toolbar-group">
          <span class="toolbar-label">Toolbar</span>
          <button class="ghost" type="button" on:click={() => setActiveEditor("question")}>
            Soal
          </button>
          <button class="ghost" type="button" on:click={() => setActiveEditor("answer")}>
            Jawaban
          </button>
          <span class="toolbar-hint">Aktif: {activeEditor === "question" ? "Soal" : "Jawaban"}</span>
        </div>
        <div class="toolbar-group">
          <button class="ghost" type="button" on:click={() => insertSnippet("\\\\frac{a}{b}")}>
            frac
          </button>
          <button class="ghost" type="button" on:click={() => insertSnippet("\\\\sqrt{x}")}>
            sqrt
          </button>
          <button class="ghost" type="button" on:click={() => insertSnippet("x^{2}")}>
            x^2
          </button>
          <button class="ghost" type="button" on:click={() => insertSnippet("x_{i}")}>
            x_i
          </button>
          <button class="ghost" type="button" on:click={() => insertSnippet("\\\\pi")}>
            π
          </button>
          <button class="ghost" type="button" on:click={() => insertSnippet("\\\\times")}>
            ×
          </button>
          <button class="ghost" type="button" on:click={() => insertSnippet("\\\\div")}>
            ÷
          </button>
          <button class="ghost" type="button" on:click={() => insertSnippet("\\\\leq")}>
            ≤
          </button>
          <button class="ghost" type="button" on:click={() => insertSnippet("\\\\geq")}>
            ≥
          </button>
        </div>
        <div class="toolbar-group">
          <select bind:value={snippetPreset}>
            <option value="">Snippet template…</option>
            <option value="linear">Persamaan linear</option>
            <option value="quadratic">Kuadrat</option>
            <option value="fraction">Pecahan campuran</option>
            <option value="area">Luas segitiga</option>
          </select>
          <button class="ghost" type="button" on:click={applyPreset} disabled={!snippetPreset}>
            Sisipkan
          </button>
        </div>
      </div>
      <input
        type="number"
        min="1"
        max="5"
        placeholder="Difficulty (1-5)"
        bind:value={form.difficulty}
        required
      />
      <textarea
        rows="3"
        placeholder="Pertanyaan"
        bind:this={questionTextarea}
        value={form.questionText}
        required
      />
      <textarea
        rows="2"
        placeholder="Jawaban benar"
        bind:this={answerTextarea}
        value={form.correctAnswer}
        required
      />
      <input placeholder="Hint (opsional)" bind:value={form.hint} />
      <textarea
        rows="3"
        placeholder="Langkah solusi (pisahkan tiap baris)"
        bind:value={form.solutionSteps}
      />
      <input
        type="number"
        min="1"
        max="600"
        placeholder="Estimasi waktu (detik)"
        bind:value={form.timeEstimate}
      />
      <button class="btn" type="submit" disabled={saving}>Simpan</button>
    </form>
  </section>

  <section class="card preview">
    <h2>Preview</h2>
    <div class="preview-block">
      <p class="label">Soal</p>
      {#if previewQuestionHtml}
        <div class="preview-text" {@html previewQuestionHtml}></div>
      {:else}
        <p class="muted">Belum ada soal.</p>
      {/if}
    </div>
    <div class="preview-block">
      <p class="label">Jawaban</p>
      {#if previewAnswerHtml}
        <div class="preview-text" {@html previewAnswerHtml}></div>
      {:else}
        <p class="muted">Belum ada jawaban.</p>
      {/if}
    </div>
    <div class="preview-block">
      <p class="label">Source Highlight</p>
      <div class="preview-text" {@html previewSourceHtml}></div>
    </div>
  </section>

  <section class="card">
    <div class="card-header">
      <h2>Daftar Soal</h2>
      <button class="ghost" on:click={loadQuestions} disabled={loading}>
        {loading ? "Memuat..." : "Refresh"}
      </button>
    </div>
    {#if error}
      <p class="error">{error}</p>
    {:else if questions.length === 0}
      <p class="muted">Belum ada soal.</p>
    {:else}
      <div class="list">
        {#each questions as q}
          <article class="item">
            <div>
              <p class="label">Topik</p>
              <p class="value">{q.topic} / {q.subTopic}</p>
            </div>
            <div>
              <p class="label">Difficulty</p>
              <p class="value">{q.difficulty}</p>
            </div>
            <div class="grow">
              <p class="label">Pertanyaan</p>
              <p class="value">{q.questionText}</p>
            </div>
            <div class="details">
              {#if q.hint}
                <p class="hint">Hint: {q.hint}</p>
              {/if}
              {#if q.solutionSteps?.length}
                <ul>
                  {#each q.solutionSteps as step}
                    <li>{step}</li>
                  {/each}
                </ul>
              {/if}
              {#if q.metadata?.timeEstimate}
                <p class="meta">Estimasi: {q.metadata.timeEstimate}s</p>
              {/if}
            </div>
            <div class="actions">
              <button class="ghost" on:click={() => editQuestion(q)}>Edit</button>
              <button class="danger" on:click={() => deleteQuestion(q.id)}>Hapus</button>
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

  type QuestionRow = {
    id: string;
    topic: string;
    subTopic: string;
    difficulty: number;
    questionText: string;
    correctAnswer: string | { value: string; format?: string };
    hint?: string;
    solutionSteps?: string[];
    metadata?: { timeEstimate?: number };
    questionData?: { format?: string };
  };

  let questions: QuestionRow[] = [];
  let loading = false;
  let saving = false;
  let error = "";

  let form = {
    topic: "",
    subTopic: "",
    questionFormat: "text",
    answerFormat: "text",
    difficulty: 3,
    questionText: "",
    correctAnswer: "",
    hint: "",
    solutionSteps: "",
    timeEstimate: 60,
  };
  let editingId: string | null = null;
  let previewQuestionHtml = "";
  let previewAnswerHtml = "";
  let previewSourceHtml = "";
  let isAuthed = false;
  let activeEditor: "question" | "answer" = "question";
  let snippetPreset = "";

  function getCorrectAnswerValue(value: QuestionRow["correctAnswer"]) {
    if (typeof value === "string") return value;
    return value?.value ?? "";
  }

  function renderMath(input: string, format: string) {
    if (!input) return "";
    if (format !== "latex") {
      return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    const katex = (window as typeof window & { katex?: any }).katex;
    if (!katex) return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    try {
      return katex.renderToString(input, { throwOnError: false });
    } catch {
      return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }

  function escapeHtml(input: string) {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderSourceHighlight(input: string, format: string) {
    if (!input) return "<em class=\"muted\">Belum ada isi.</em>";
    const safe = escapeHtml(input);
    if (format !== "latex") {
      return `<pre><code>${safe}</code></pre>`;
    }
    const prism = (window as typeof window & { Prism?: any }).Prism;
    if (!prism || !prism.languages?.latex) {
      return `<pre><code>${safe}</code></pre>`;
    }
    const html = prism.highlight(input, prism.languages.latex, "latex");
    return `<pre class="language-latex"><code class="language-latex">${html}</code></pre>`;
  }

  function setActiveEditor(target: "question" | "answer") {
    activeEditor = target;
    if (target === "question") {
      questionEditor?.focus();
    } else {
      answerEditor?.focus();
    }
  }

  function insertSnippet(snippet: string) {
    const editor = activeEditor === "question" ? questionEditor : answerEditor;
    if (!editor) return;
    const doc = editor.getDoc();
    const cursor = doc.getCursor();
    doc.replaceRange(snippet, cursor);
    doc.setCursor({
      line: cursor.line,
      ch: cursor.ch + snippet.length,
    });
    editor.focus();
  }

  function applyPreset() {
    if (!snippetPreset) return;
    const presets: Record<string, string> = {
      linear: "Selesaikan: 2x + 5 = 17",
      quadratic: "Hitung akar: x^{2} - 5x + 6 = 0",
      fraction: "Sederhanakan: \\\\frac{3}{4} + \\\\frac{2}{3}",
      area: "Luas segitiga dengan alas 8 cm dan tinggi 5 cm",
    };
    const snippet = presets[snippetPreset];
    if (snippet) {
      insertSnippet(snippet);
    }
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  async function loadQuestions() {
    loading = true;
    error = "";
    try {
      const res = await fetch(`${API_BASE}/api/teacher/questions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal memuat soal");
      questions = data.questions ?? [];
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading = false;
    }
  }

  async function createQuestion() {
    saving = true;
    error = "";
    try {
      const payload = {
        topic: form.topic,
        subTopic: form.subTopic,
        difficulty: form.difficulty,
        questionText: form.questionText,
        correctAnswer: form.correctAnswer,
        hint: form.hint || undefined,
        questionFormat: form.questionFormat,
        answerFormat: form.answerFormat,
        solutionSteps: form.solutionSteps
          ? form.solutionSteps.split("\n").map((s) => s.trim()).filter(Boolean)
          : undefined,
        timeEstimate: form.timeEstimate || undefined,
      };
      const res = await fetch(
        `${API_BASE}/api/teacher/questions${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal menyimpan");
      editingId = null;
      form = {
        topic: "",
        subTopic: "",
        questionFormat: "text",
        answerFormat: "text",
        difficulty: 3,
        questionText: "",
        correctAnswer: "",
        hint: "",
        solutionSteps: "",
        timeEstimate: 60,
      };
      await loadQuestions();
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      saving = false;
    }
  }

  function editQuestion(q: QuestionRow) {
    editingId = q.id;
    form = {
      topic: q.topic,
      subTopic: q.subTopic,
      questionFormat: q.questionData?.format ?? "text",
      answerFormat:
        typeof q.correctAnswer === "string" ? "text" : q.correctAnswer?.format ?? "text",
      difficulty: q.difficulty,
      questionText: q.questionText,
      correctAnswer: getCorrectAnswerValue(q.correctAnswer),
      hint: q.hint ?? "",
      solutionSteps: q.solutionSteps ? q.solutionSteps.join("\n") : "",
      timeEstimate: q.metadata?.timeEstimate ?? 60,
    };
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Hapus soal ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/teacher/questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal menghapus");
      await loadQuestions();
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
      await loadQuestions();
    }
  });
  $: previewQuestionHtml = typeof window === "undefined"
    ? ""
    : renderMath(form.questionText, form.questionFormat);
  $: previewAnswerHtml = typeof window === "undefined"
    ? ""
    : renderMath(form.correctAnswer, form.answerFormat);
  $: previewSourceHtml = typeof window === "undefined"
    ? ""
    : renderSourceHighlight(form.questionText, form.questionFormat);

  let questionTextarea: HTMLTextAreaElement;
  let answerTextarea: HTMLTextAreaElement;
  let questionEditor: any;
  let answerEditor: any;

  function initEditor(element: HTMLTextAreaElement, mode: string) {
    const cm = (window as typeof window & { CodeMirror?: any }).CodeMirror;
    if (!cm) return null;
    return cm.fromTextArea(element, {
      lineNumbers: true,
      mode,
      theme: "material-darker",
      viewportMargin: Infinity,
    });
  }

  function updateEditorMode(editor: any, mode: string) {
    if (!editor) return;
    editor.setOption("mode", mode);
  }

  function syncEditorValue(editor: any, value: string) {
    if (!editor) return;
    if (editor.getValue() !== value) {
      editor.setValue(value);
    }
  }

  onMount(() => {
    questionEditor = initEditor(
      questionTextarea,
      form.questionFormat === "latex" ? "stex" : "text",
    );
    answerEditor = initEditor(
      answerTextarea as HTMLTextAreaElement,
      form.answerFormat === "latex" ? "stex" : "text",
    );
    if (questionEditor) {
      questionEditor.on("change", () => {
        form.questionText = questionEditor.getValue();
      });
      questionEditor.on("focus", () => {
        activeEditor = "question";
      });
    }
    if (answerEditor) {
      answerEditor.on("change", () => {
        form.correctAnswer = answerEditor.getValue();
      });
      answerEditor.on("focus", () => {
        activeEditor = "answer";
      });
    }
  });

  $: if (questionEditor) {
    updateEditorMode(
      questionEditor,
      form.questionFormat === "latex" ? "stex" : "text",
    );
  }
  $: if (answerEditor) {
    updateEditorMode(
      answerEditor,
      form.answerFormat === "latex" ? "stex" : "text",
    );
  }
  $: if (questionEditor) {
    syncEditorValue(questionEditor, form.questionText);
  }
  $: if (answerEditor) {
    syncEditorValue(answerEditor, form.correctAnswer);
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
    max-width: 980px;
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


  .row {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .toolbar {
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    background: #f7f4ed;
    border: 1px solid rgba(31, 29, 27, 0.08);
  }

  .toolbar-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .toolbar-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #7c6b58;
  }

  .toolbar-hint {
    font-size: 0.85rem;
    color: #6d655c;
  }

  input,
  textarea,
  select {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(31, 29, 27, 0.2);
    font-size: 1rem;
  }

  .mono {
    font-family: "JetBrains Mono", "SF Mono", ui-monospace, monospace;
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

  .details {
    grid-column: 1 / -1;
  }

  .details ul {
    margin: 6px 0 0;
    padding-left: 16px;
    color: #5c5348;
  }

  .hint {
    margin: 6px 0 0;
    color: #7c6b58;
  }

  .meta {
    margin: 6px 0 0;
    color: #7c6b58;
  }

  .grow {
    grid-column: span 2;
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

  .preview {
    background: #fffaf2;
  }

  .preview-block {
    margin-top: 12px;
    padding: 12px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid rgba(31, 29, 27, 0.08);
  }

  .preview-text {
    font-size: 1.1rem;
  }

  .preview-text pre {
    margin: 0;
    padding: 12px;
    border-radius: 10px;
    background: #1f1d1b;
    color: #f8f5ef;
    overflow: auto;
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
