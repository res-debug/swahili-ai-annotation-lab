/* =========================================================
   Swahili AI Annotation Lab — script.js
   Portfolio simulation · synthetic data only
   ========================================================= */

const STORAGE_KEY = "swahili-ai-annotation-lab:v1";
const DATA_URL = "data/annotations.json";

const LABEL_GROUPS = ["sentiment", "intent", "topic", "language"];

/* ---------- State ---------- */
const state = {
  examples: [],
  currentIndex: 0,
  annotations: {}, // id -> {sentiment,intent,topic,language,note,skipped,flagged}
  view: "annotate",
  dataReady: false
};

/* ---------- DOM helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const els = {
  navButtons: $$(".nav-btn"),
  views: {
    annotate: $("#view-annotate"),
    guidelines: $("#view-guidelines"),
    review: $("#view-review"),
    dashboard: $("#view-dashboard")
  },
  progressPercent: $("#progress-percent"),
  progressBar: $("#progress-bar"),
  progressFill: $("#progress-fill"),
  statCompleted: $("#stat-completed"),
  statSkipped: $("#stat-skipped"),
  statRemaining: $("#stat-remaining"),
  taskCounter: $("#task-counter"),
  taskId: $("#task-id"),
  taskDomain: $("#task-domain"),
  taskSentence: $("#task-sentence"),
  flagIncomplete: $("#flag-incomplete"),
  form: $("#annotation-form"),
  note: $("#annotator-note"),
  saveBtn: $("#save-btn"),
  skipBtn: $("#skip-btn"),
  prevBtn: $("#prev-btn"),
  exportJson: $("#export-json"),
  exportCsv: $("#export-csv"),
  resetBtn: $("#reset-btn"),
  reviewList: $("#review-list"),
  reviewRefresh: $("#review-refresh"),
  dashRefresh: $("#dash-refresh"),
  dTotal: $("#d-total"),
  dCompleted: $("#d-completed"),
  dSkipped: $("#d-skipped"),
  dIncomplete: $("#d-incomplete"),
  distSentiment: $("#dist-sentiment"),
  distIntent: $("#dist-intent"),
  distTopic: $("#dist-topic"),
  distLanguage: $("#dist-language"),
  toast: $("#toast"),
  modal: $("#modal"),
  modalCancel: $("#modal-cancel"),
  modalConfirm: $("#modal-confirm")
};

/* =========================================================
   Core pure-ish helpers (also used by tests)
   ========================================================= */

/** Returns true when all four label groups are set. */
export function isComplete(annotation) {
  if (!annotation) return false;
  return LABEL_GROUPS.every(
    (g) => typeof annotation[g] === "string" && annotation[g].trim() !== ""
  );
}

/** Build a normalized annotation object from the current form. */
export function buildAnnotation(formLike, noteText = "") {
  const annotation = {
    sentiment: "",
    intent: "",
    topic: "",
    language: "",
    note: String(noteText || "").trim(),
    skipped: false,
    flagged: false
  };
  LABEL_GROUPS.forEach((group) => {
    const value = formLike[group];
    if (typeof value === "string") annotation[group] = value;
  });
  annotation.flagged = !isComplete(annotation);
  return annotation;
}

/** Compute aggregate progress + distributions from an annotations map. */
export function computeStats(examples, annotations) {
  const stats = {
    total: examples.length,
    completed: 0,
    skipped: 0,
    incomplete: 0,
    distributions: {
      sentiment: {},
      intent: {},
      topic: {},
      language: {}
    }
  };

  examples.forEach((ex) => {
    const a = annotations[ex.id];
    if (!a) return;
    if (a.skipped) {
      stats.skipped += 1;
      return;
    }
    if (isComplete(a)) {
      stats.completed += 1;
      LABEL_GROUPS.forEach((g) => {
        const v = a[g];
        if (!v) return;
        stats.distributions[g][v] = (stats.distributions[g][v] || 0) + 1;
      });
    } else {
      stats.incomplete += 1;
    }
  });

  stats.remaining = Math.max(0, stats.total - stats.completed - stats.skipped);
  stats.percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  return stats;
}

/** Convert annotations into CSV text. */
export function toCSV(examples, annotations) {
  const header = [
    "id",
    "sentence",
    "domain",
    "sentiment",
    "intent",
    "topic",
    "language",
    "note",
    "skipped",
    "flagged"
  ];
  const rows = [header.join(",")];
  examples.forEach((ex) => {
    const a = annotations[ex.id] || {};
    const row = [
      ex.id,
      ex.sentence,
      ex.domain || "",
      a.sentiment || "",
      a.intent || "",
      a.topic || "",
      a.language || "",
      a.note || "",
      a.skipped ? "true" : "false",
      a.flagged ? "true" : "false"
    ].map(csvEscape);
    rows.push(row.join(","));
  });
  return rows.join("\n");
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Validate a single annotation record; returns list of error strings. */
export function validateAnnotation(annotation) {
  const errors = [];
  if (!annotation) return ["annotation is missing"];
  LABEL_GROUPS.forEach((g) => {
    if (!annotation[g]) errors.push(`missing ${g}`);
  });
  return errors;
}

/** Get a human reason why the row is incomplete. */
export function describeIncomplete(annotation) {
  const missing = LABEL_GROUPS.filter((g) => !annotation || !annotation[g]);
  if (missing.length === 0) return "";
  return `Missing: ${missing.join(", ")}`;
}

/* =========================================================
   Persistence
   ========================================================= */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.annotations = parsed.annotations || {};
      state.currentIndex = Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0;
    }
  } catch (err) {
    console.warn("Could not load saved state:", err);
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        annotations: state.annotations,
        currentIndex: state.currentIndex,
        savedAt: new Date().toISOString()
      })
    );
  } catch (err) {
    console.warn("Could not save state:", err);
    showToast("Storage is unavailable — progress not saved.");
  }
}

/* =========================================================
   Data loading
   ========================================================= */

async function loadDataset() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load dataset: ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.examples) || data.examples.length === 0) {
    throw new Error("Dataset is empty or malformed.");
  }
  state.examples = data.examples;
  state.dataReady = true;
  if (state.currentIndex >= state.examples.length) state.currentIndex = 0;
}

/* =========================================================
   Rendering
   ========================================================= */

function setView(view) {
  state.view = view;
  els.navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  Object.entries(els.views).forEach(([name, node]) => {
    if (!node) return;
    const active = name === view;
    node.hidden = !active;
    node.classList.toggle("active", active);
  });
  if (view === "review") renderReview();
  if (view === "dashboard") renderDashboard();
}

function renderTask() {
  if (!state.dataReady || state.examples.length === 0) return;
  const ex = state.examples[state.currentIndex];
  const a = state.annotations[ex.id] || {};

  els.taskId.textContent = ex.id;
  els.taskDomain.textContent = `Domain: ${ex.domain || "general"}`;
  els.taskSentence.textContent = ex.sentence;
  els.taskCounter.textContent = `Task ${state.currentIndex + 1} / ${state.examples.length}`;

  // Reset radios & apply saved values
  $$('input[type="radio"]', els.form).forEach((input) => {
    const group = input.name;
    input.checked = input.value === a[group];
  });
  els.note.value = a.note || "";

  const complete = isComplete(a);
  els.flagIncomplete.hidden = complete || !a || a.skipped;
  if (!els.flagIncomplete.hidden) {
    els.flagIncomplete.textContent = `⚠ Incomplete — ${describeIncomplete(a)}`;
  }

  els.prevBtn.disabled = state.currentIndex === 0;
}

function renderProgress() {
  const stats = computeStats(state.examples, state.annotations);
  els.progressPercent.textContent = `${stats.percent}%`;
  els.progressFill.style.width = `${stats.percent}%`;
  els.progressBar.setAttribute("aria-valuenow", String(stats.percent));
  els.statCompleted.textContent = stats.completed;
  els.statSkipped.textContent = stats.skipped;
  els.statRemaining.textContent = stats.remaining;
}

function renderDashboard() {
  const stats = computeStats(state.examples, state.annotations);
  els.dTotal.textContent = stats.total;
  els.dCompleted.textContent = stats.completed;
  els.dSkipped.textContent = stats.skipped;
  els.dIncomplete.textContent = stats.incomplete;

  renderDistribution(els.distSentiment, stats.distributions.sentiment, stats.completed);
  renderDistribution(els.distIntent, stats.distributions.intent, stats.completed);
  renderDistribution(els.distTopic, stats.distributions.topic, stats.completed);
  renderDistribution(els.distLanguage, stats.distributions.language, stats.completed);
}

function renderDistribution(container, dist, denominator) {
  if (!container) return;
  container.innerHTML = "";
  const entries = Object.entries(dist);
  if (entries.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No data yet.";
    container.appendChild(li);
    return;
  }
  const max = Math.max(...entries.map(([, v]) => v));
  entries
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, count]) => {
      const pct = denominator ? Math.round((count / denominator) * 100) : 0;
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${escapeHtml(label)}</span>
        <div class="bar"><i style="width:${max ? (count / max) * 100 : 0}%"></i></div>
        <span class="val">${pct}%</span>
      `;
      container.appendChild(li);
    });
}

function renderReview() {
  if (!els.reviewList) return;
  els.reviewList.innerHTML = "";

  // Show reference-backed examples the user has annotated, or all references.
  const items = state.examples.filter((ex) => ex.reference);
  if (items.length === 0) {
    els.reviewList.innerHTML = "<p class='muted'>No reference examples available.</p>";
    return;
  }

  items.slice(0, 10).forEach((ex) => {
    const user = state.annotations[ex.id] || {};
    const ref = ex.reference;
    const match =
      isComplete(user) &&
      LABEL_GROUPS.every((g) => user[g] === ref[g]);

    const card = document.createElement("article");
    card.className = "review-card";
    card.innerHTML = `
      <h3>${escapeHtml(ex.id)} · ${escapeHtml(ex.domain || "general")}</h3>
      <p class="review-sentence" lang="sw">${escapeHtml(ex.sentence)}</p>
      <div class="review-grid">
        ${LABEL_GROUPS.map((g) => {
          const userVal = user[g] || "—";
          const refVal = ref[g] || "—";
          const ok = user[g] && user[g] === ref[g];
          return `
            <div class="review-cell">
              <span>${g}</span>
              <strong>You: ${escapeHtml(userVal)}</strong>
              <div class="${ok ? "match-ok" : "match-bad"}">
                Ref: ${escapeHtml(refVal)} ${user[g] ? (ok ? "✓" : "✗") : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
      <p class="${match ? "match-ok" : "match-bad"}">
        ${user && Object.keys(user).length ? (match ? "Full match with reference." : "Not a full match yet.") : "Not annotated yet."}
      </p>
      <p class="explanation">${escapeHtml(ex.explanation || "No explanation provided.")}</p>
    `;
    els.reviewList.appendChild(card);
  });
}

/* =========================================================
   Form handling
   ========================================================= */

function readForm() {
  const data = {};
  LABEL_GROUPS.forEach((group) => {
    const checked = $(`input[name="${group}"]:checked`, els.form);
    data[group] = checked ? checked.value : "";
  });
  return data;
}

function handleSave(event) {
  event?.preventDefault();
  if (!state.dataReady) return;
  const ex = state.examples[state.currentIndex];
  const values = readForm();
  const note = els.note.value;

  const annotation = buildAnnotation(values, note);
  annotation.skipped = false;

  if (!isComplete(annotation)) {
    // Keep the partial record so it's flagged & recoverable
    annotation.flagged = true;
    state.annotations[ex.id] = annotation;
    saveState();
    renderProgress();
    els.flagIncomplete.hidden = false;
    els.flagIncomplete.textContent = `⚠ Incomplete — ${describeIncomplete(annotation)}`;
    showToast("Incomplete: please set all four labels before saving.");
    return;
  }

  state.annotations[ex.id] = annotation;
  saveState();
  renderProgress();
  showToast(`Saved ${ex.id}.`);
  goNext();
}

function handleSkip() {
  if (!state.dataReady) return;
  const ex = state.examples[state.currentIndex];
  state.annotations[ex.id] = {
    sentiment: "",
    intent: "",
    topic: "",
    language: "",
    note: "",
    skipped: true,
    flagged: false
  };
  saveState();
  renderProgress();
  showToast(`Skipped ${ex.id}.`);
  goNext();
}

function goNext() {
  if (state.examples.length === 0) return;
  state.currentIndex = (state.currentIndex + 1) % state.examples.length;
  saveState();
  renderTask();
}

function goPrev() {
  if (state.examples.length === 0) return;
  state.currentIndex = (state.currentIndex - 1 + state.examples.length) % state.examples.length;
  saveState();
  renderTask();
}

/* =========================================================
   Export
   ========================================================= */

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const payload = {
    project: "Swahili AI Annotation Lab",
    disclaimer: "Portfolio simulation using synthetic data. Not a real employer project.",
    exportedAt: new Date().toISOString(),
    total: state.examples.length,
    stats: computeStats(state.examples, state.annotations),
    annotations: state.examples.map((ex) => ({
      id: ex.id,
      sentence: ex.sentence,
      domain: ex.domain,
      ...(state.annotations[ex.id] || {})
    }))
  };
  download(
    "swahili-ai-annotations.json",
    JSON.stringify(payload, null, 2),
    "application/json"
  );
  showToast("Exported JSON.");
}

function exportCSV() {
  const csv = toCSV(state.examples, state.annotations);
  download("swahili-ai-annotations.csv", csv, "text/csv;charset=utf-8;");
  showToast("Exported CSV.");
}

/* =========================================================
   Reset
   ========================================================= */

function openResetModal() { els.modal.hidden = false; }
function closeResetModal() { els.modal.hidden = true; }

function confirmReset() {
  state.annotations = {};
  state.currentIndex = 0;
  saveState();
  closeResetModal();
  renderTask();
  renderProgress();
  if (state.view === "dashboard") renderDashboard();
  if (state.view === "review") renderReview();
  showToast("All progress has been reset.");
}

/* =========================================================
   Toast
   ========================================================= */

let toastTimer = null;
function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

/* =========================================================
   Utilities
   ========================================================= */

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================================================
   Wire-up
   ========================================================= */

function bindEvents() {
  els.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  els.form.addEventListener("submit", handleSave);
  els.skipBtn.addEventListener("click", handleSkip);
  els.prevBtn.addEventListener("click", goPrev);

  els.exportJson.addEventListener("click", exportJSON);
  els.exportCsv.addEventListener("click", exportCSV);

  els.resetBtn.addEventListener("click", openResetModal);
  els.modalCancel.addEventListener("click", closeResetModal);
  els.modalConfirm.addEventListener("click", confirmReset);

  els.reviewRefresh?.addEventListener("click", renderReview);
  els.dashRefresh?.addEventListener("click", renderDashboard);

  // Re-render flag when radios change
  $$('input[type="radio"]', els.form).forEach((input) => {
    input.addEventListener("change", () => {
      const values = readForm();
      const complete = LABEL_GROUPS.every((g) => values[g]);
      els.flagIncomplete.hidden = complete;
      if (!complete) {
        els.flagIncomplete.textContent = `⚠ Incomplete — ${describeIncomplete(values)}`;
      }
    });
  });

  // Close modal on overlay click
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeResetModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.modal.hidden) closeResetModal();
  });
}

async function init() {
  bindEvents();
  loadState();

  try {
    await loadDataset();
  } catch (err) {
    console.error(err);
    els.taskSentence.textContent = "Could not load dataset. Serve this site over HTTP (not file://).";
    showToast("Dataset failed to load.");
    return;
  }

  renderTask();
  renderProgress();
  setView("annotate");
}

// Only auto-init in a browser (not when imported by Node tests)
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}