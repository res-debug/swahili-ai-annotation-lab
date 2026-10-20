# 🌍 Swahili AI Annotation Lab

An interactive, browser-based **simulation** of how human contributors annotate Swahili text for AI training pipelines. Built as an independent portfolio project using **synthetic data only**.

> ⚠️ **Disclaimer:** This is **not** a real employer project, not a commercial annotation platform, and not affiliated with any AI company. All 50 sentences are synthetic examples written for demonstration. The repository exists to showcase front-end engineering, data-annotation UX, and lightweight testing.

---

## 🎯 Project objectives

1. Demonstrate a realistic annotation workflow for low-resource language data (Swahili).
2. Showcase a polished, responsive annotation platform UI built with **vanilla HTML, CSS, and JS**.
3. Provide clear, defensible **annotation guidelines** for sentiment, intent, topic, and language.
4. Prove engineering rigor with **pure, testable helpers** and a passing test suite.
5. Ship as a **static GitHub Pages** site with zero backend and zero API keys.

---

## ✨ Features

| # | Feature |
|---|---------|
| 1 | 50 original synthetic Swahili sentences across everyday Kenyan life |
| 2 | Four annotation dimensions: sentiment, intent, topic, language |
| 3 | Labels: positive, negative, neutral · question, request, complaint, greeting, statement · health, transport, money, education, food, family, weather, other · swahili, english, code-switching |
| 4 | Built-in guidelines view with definitions |
| 5 | Label, edit, skip, and navigate (Previous / Save & Next) |
| 6 | Live progress bar, completed/skipped/remaining counters |
| 7 | Incomplete-annotation flag with human-readable missing-field list |
| 8 | Export to **CSV** and **JSON** (fully client-side) |
| 9 | Progress auto-saved to `localStorage` |
| 10 | Reset flow with confirmation modal |
| 11 | Fully responsive layout (desktop → mobile) |
| 12 | Review Mode with reference labels + explanations and match indicators |
| 13 | Dashboard with per-dimension label distribution bars |
| 14 | Keyboard accessible controls, skip-link, `prefers-reduced-motion` support |

---

## 🧠 Annotation methodology

Each sentence is classified along **four independent axes**:

### Sentiment
- **positive** — gratitude, joy, satisfaction
- **negative** — frustration, complaint, dissatisfaction
- **neutral** — factual, no clear polarity

### Intent
- **question** — seeks information
- **request** — asks for an action or favor
- **complaint** — reports a problem
- **greeting** — opens a conversation / congratulates / thanks
- **statement** — declares information

### Topic
`health`, `transport`, `money`, `education`, `food`, `family`, `weather`, `other`

### Language
- **swahili** — predominantly Swahili
- **english** — predominantly English
- **code-switching** — meaningful mixing (includes common Kenyan loanwords like *M-Pesa*, *boda boda* where they function as mixed-language tokens)

### Workflow rules
1. All four labels are required to mark a row complete.
2. **Skip** preserves the row as unlabeled (it does not count as completed).
3. Notes are optional but encouraged for edge cases.
4. The review mode compares user labels against curated reference labels with explanations.
5. Progress persists in `localStorage` and survives page reloads.

---

## 📸 Sample screenshots (instructions)

To capture screenshots for your own README:

1. Serve the project locally: `npx serve .` (or `python -m http.server`).
2. Open `http://localhost:3000` (or the printed URL).
3. Capture:
   - **Annotate** view with a sentence and partially filled chips.
   - **Guidelines** view.
   - **Review Mode** showing a full match and a mismatch.
   - **Dashboard** with distributions after ~20 annotations.
   - Mobile view (resize to ~390px width) to show responsiveness.
4. Save as `docs/screenshot-annotate.png`, `docs/screenshot-review.png`, etc., and reference them in this README:

   ```md
   ![Annotation workspace](docs/screenshot-annotate.png)
   ```

> Add the `docs/` folder to your repo if you commit screenshots.

---

## 🚀 Local setup

The dataset is loaded via `fetch`, so you must serve the folder over HTTP (not `file://`).

```bash
# Clone
git clone https://github.com/<your-username>/swahili-ai-annotation-lab.git
cd swahili-ai-annotation-lab

# Option A: npx serve
npx serve .

# Option B: Python 3
python3 -m http.server 8000

# Option C: PHP
php -S localhost:8000
```

Then open `http://localhost:3000` (or `:8000`).

### Run tests

```bash
node --test tests/
```

Expected output: **6 passing tests** covering validation, progress, and export.

---

## 🌐 Deployment to GitHub Pages

1. Create a new repository on GitHub named `swahili-ai-annotation-lab`.
2. Push the code (see commands below).
3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
4. The included workflow (`.github/workflows/deploy.yml`) will:
   - run `node --test tests/`
   - publish the static site
5. Your site will be live at `https://<your-username>.github.io/swahili-ai-annotation-lab/`.

---

## 🧪 Tests

`tests/tests.js` uses Node's built-in test runner (`node --test`) and imports the **pure** helpers from `script.js`:

| Test | What it proves |
|------|----------------|
| `isComplete` | Completeness requires all four labels |
| `buildAnnotation` | Form-to-record normalization & flagging |
| `computeStats` | Completed / skipped / remaining / percent / distributions |
| `validateAnnotation` | Missing-field reporting |
| `describeIncomplete` | Human-readable incomplete messages |
| `toCSV` | Header + row-per-example, proper quoting |

Run: `node --test tests/`

---

## 🧱 Tech stack

- **HTML5** — semantic structure, accessible landmarks
- **CSS3** — custom properties, grid/flex, responsive breakpoints, reduced-motion support
- **Vanilla JavaScript** — ES modules, no frameworks, no build step
- **JSON** — dataset
- **localStorage** — progress persistence
- **GitHub Actions** — CI + Pages deployment

No backend. No API keys. No paid services. No trackers.

---

## 🚧 Limitations

- Dataset is **synthetic** and small (50 examples); not suitable for real model training.
- Reference labels reflect one annotator's judgment; real annotation would use inter-annotator agreement.
- No authentication or multi-user collaboration.
- `localStorage` is per-browser; clearing site data erases progress.
- Code-switching boundaries are inherently fuzzy; the labels are simplified for demonstration.
- No server-side validation or audit trail.

---

## 🔮 Future improvements

- Replace JSON fetch with an IndexedDB-backed queue for offline-first editing.
- Add **inter-annotator agreement** view (Cohen's κ) when multiple local profiles exist.
- Add **active learning** simulation: surface the highest-uncertainty examples first.
- Support **multiple annotation passes** (double annotation) and adjudication.
- Add **Swahili audio pronunciation** using the Web Speech API.
- Add a **leaderboard-free** gamified daily goal (private to the browser).
- Provide a **JSON Schema** and CI validation of `annotations.json`.
- Add **dark mode** toggle for the workspace.
- Expand to **1000+ sentences** with a proper contribution guide.

---

## 📄 License

[MIT](./LICENSE) — free for portfolio and educational reuse.

---

## 🙏 Attribution

- Built as an independent portfolio simulation.
- All Swahili sentences are original synthetic examples written for this project.
- Inspired by public discussions of low-resource language annotation, but not derived from any proprietary dataset.