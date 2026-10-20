/* =========================================================
   Swahili AI Annotation Lab — tests.js
   Run with:  node --test tests/
   These tests import pure helpers from script.js (no DOM needed).
   ========================================================= */

import test from "node:test";
import assert from "node:assert/strict";
import {
  isComplete,
  buildAnnotation,
  computeStats,
  toCSV,
  validateAnnotation,
  describeIncomplete
} from "../script.js";

/* Shared fixtures */
const EXAMPLES = [
  { id: "SW-001", sentence: "Habari za asubuhi", domain: "daily life" },
  { id: "SW-002", sentence: "Nina homa leo", domain: "health" },
  { id: "SW-003", sentence: "Please call me back", domain: "daily life" },
  { id: "SW-004", sentence: "Matatu imechelewa", domain: "transport" }
];

const COMPLETE = {
  sentiment: "positive",
  intent: "greeting",
  topic: "family",
  language: "swahili",
  note: "",
  skipped: false,
  flagged: false
};

/* ---------- 1. isComplete ---------- */
test("isComplete: true only when all four labels are non-empty", () => {
  assert.equal(isComplete(COMPLETE), true);
  assert.equal(isComplete({ ...COMPLETE, sentiment: "" }), false);
  assert.equal(isComplete({ ...COMPLETE, language: undefined }), false);
  assert.equal(isComplete(null), false);
  assert.equal(isComplete({}), false);
});

/* ---------- 2. buildAnnotation ---------- */
test("buildAnnotation: fills defaults, sets flagged for incomplete input", () => {
  const complete = buildAnnotation(
    { sentiment: "negative", intent: "complaint", topic: "transport", language: "swahili" },
    "  clear complaint  "
  );
  assert.equal(complete.sentiment, "negative");
  assert.equal(complete.note, "clear complaint");
  assert.equal(complete.flagged, false);
  assert.equal(complete.skipped, false);

  const partial = buildAnnotation({ sentiment: "neutral" }, "");
  assert.equal(partial.flagged, true);
  assert.equal(partial.topic, "");
});

/* ---------- 3. computeStats progress tracking ---------- */
test("computeStats: counts completed, skipped, remaining, incomplete, and percent", () => {
  const annotations = {
    "SW-001": { ...COMPLETE },
    "SW-002": { sentiment: "negative", intent: "", topic: "health", language: "swahili", skipped: false, flagged: true },
    "SW-003": { sentiment: "", intent: "", topic: "", language: "", skipped: true, flagged: false }
  };
  const stats = computeStats(EXAMPLES, annotations);
  assert.equal(stats.total, 4);
  assert.equal(stats.completed, 1);
  assert.equal(stats.skipped, 1);
  assert.equal(stats.incomplete, 1);
  assert.equal(stats.remaining, 2); // 4 - 1 completed - 1 skipped
  assert.equal(stats.percent, 25);  // 1 / 4
  assert.equal(stats.distributions.sentiment.positive, 1);
});

/* ---------- 4. validateAnnotation ---------- */
test("validateAnnotation: lists every missing label", () => {
  const errors = validateAnnotation({ sentiment: "neutral", intent: "", topic: "food", language: "" });
  assert.equal(errors.includes("missing intent"), true);
  assert.equal(errors.includes("missing language"), true);
  assert.equal(errors.includes("missing sentiment"), false);
  assert.deepEqual(validateAnnotation(null), ["annotation is missing"]);
  assert.deepEqual(validateAnnotation(COMPLETE), []);
});

/* ---------- 5. describeIncomplete ---------- */
test("describeIncomplete: reports exact missing fields", () => {
  const msg = describeIncomplete({ sentiment: "positive", intent: "", topic: "family", language: "" });
  assert.match(msg, /intent/);
  assert.match(msg, /language/);
  assert.equal(describeIncomplete(COMPLETE), "");
});

/* ---------- 6. toCSV export ---------- */
test("toCSV: produces header + one row per example, escaping special chars", () => {
  const annotations = {
    "SW-001": { ...COMPLETE, note: 'Contains, comma and "quotes"' },
    "SW-002": { sentiment: "negative", intent: "statement", topic: "health", language: "swahili", note: "", skipped: false, flagged: false }
  };
  const csv = toCSV(EXAMPLES, annotations);
  const lines = csv.split("\n");
  assert.equal(lines.length, EXAMPLES.length + 1); // header + 4 rows
  assert.equal(
    lines[0],
    "id,sentence,domain,sentiment,intent,topic,language,note,skipped,flagged"
  );
  // Quoted escape for comma/quotes
  assert.match(lines[1], /"Contains, comma and ""quotes"""/);
  // Missing annotation still produces a row
  assert.match(lines[3], /^SW-003,Please call me back,daily life,,,,,,false,false$/);
});
