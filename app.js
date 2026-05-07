const MODES = [
  ["vocab_quiz", "Vocabulary"],
  ["sentence_builder", "Sentence Builder"],
  ["email_practice", "Email"],
  ["scenario_roleplay", "Scenario"],
  ["listening_practice", "Listening"],
  ["speaking_practice", "Speaking"]
];

const SHEET_ID = "1fnNj872m_CM6oi-d-v7rqLHofSh6-NDUQuMiMr9kDvc";
const sampleQuestions = [
  {
    question_id: "demo_customs_001",
    source_id: "demo_001",
    mode: "vocab_quiz",
    prompt: "清关 means what?",
    choices: "customs clearance|warehouse inventory|delivery route|packing damage",
    answer: "customs clearance",
    explanation: "清关 หมายถึงการดำเนินพิธีการศุลกากรให้เรียบร้อย",
    audio_script: "这批货还在清关中。",
    speaking_prompt: "",
    keywords: "清关, customs clearance",
    language: "zh-en",
    category: "customs",
    level: "easy"
  },
  {
    question_id: "demo_customs_002",
    source_id: "demo_001",
    mode: "listening_practice",
    prompt: "What is the current status of the shipment?",
    choices: "It is still under customs clearance.|It has arrived at the warehouse.|The driver is on the way.|The invoice is missing.",
    answer: "It is still under customs clearance.",
    explanation: "这批货还在清关中 หมายถึงสินค้ายังอยู่ระหว่างพิธีการศุลกากร",
    audio_script: "这批货还在清关中。",
    speaking_prompt: "",
    keywords: "shipment, customs clearance, 清关",
    language: "zh",
    category: "customs",
    level: "easy"
  },
  {
    question_id: "demo_customs_003",
    source_id: "demo_001",
    mode: "speaking_practice",
    prompt: "ตอบลูกค้าเป็นภาษาอังกฤษหรือภาษาจีนว่า สินค้ายังอยู่ระหว่างพิธีการศุลกากร",
    choices: "",
    answer: "The shipment is still under customs clearance. | 这批货还在清关中。",
    explanation: "คำตอบควรสื่อว่าสินค้ายังอยู่ในขั้นตอนศุลกากร",
    audio_script: "The customer asks if the shipment has been released.",
    speaking_prompt: "Please reply politely to the customer.",
    keywords: "shipment, customs clearance, 清关",
    language: "en-zh",
    category: "customs",
    level: "easy"
  }
];

const state = {
  endpoint: localStorage.getItem("trainerEndpoint") || "",
  mode: "vocab_quiz",
  questions: [],
  current: null,
  startedAt: null,
  answers: [],
  replayCount: 0,
  bestStreak: 0,
  streak: 0
};

const $ = (selector) => document.querySelector(selector);

function nowBangkok() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" });
}

function makeId(prefix) {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `${prefix}_${stamp}_${Math.random().toString(36).slice(2, 6)}`;
}

async function api(action, payload = {}) {
  if (!state.endpoint) {
    return localFallback(action, payload);
  }

  const response = await fetch(state.endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload, sheetId: SHEET_ID })
  });

  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Google Sheet request failed");
  return data;
}

function localFallback(action, payload) {
  if (action === "listApprovedQuestions") {
    return Promise.resolve({ ok: true, rows: sampleQuestions });
  }
  if (action === "appendRawInput") {
    const rows = JSON.parse(localStorage.getItem("rawInputDrafts") || "[]");
    rows.push(payload);
    localStorage.setItem("rawInputDrafts", JSON.stringify(rows));
    return Promise.resolve({ ok: true, local: true });
  }
  if (action === "appendGameSession" || action === "appendReviewQueue") {
    return Promise.resolve({ ok: true, local: true });
  }
  return Promise.resolve({ ok: true });
}

function parseChoices(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {
    return value.split(/\||\n/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function switchView(viewName) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  $(`#${viewName}View`).classList.add("active");
}

function renderModes() {
  const picker = $("#modePicker");
  picker.innerHTML = "";
  MODES.forEach(([id, label]) => {
    const button = document.createElement("button");
    button.className = `mode-button ${id === state.mode ? "active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.mode = id;
      state.current = null;
      renderModes();
      renderQuestionList();
      renderExercise();
    });
    picker.append(button);
  });
}

function renderQuestionList() {
  const list = $("#questionList");
  const questions = state.questions.filter((question) => question.mode === state.mode);
  list.innerHTML = "";

  if (!questions.length) {
    list.innerHTML = `<div class="question-row"><strong>No approved questions yet</strong><small>Use the review sheet to approve generated items.</small></div>`;
    return;
  }

  questions.forEach((question, index) => {
    const button = document.createElement("button");
    button.className = `question-row ${state.current?.question_id === question.question_id ? "active" : ""}`;
    button.innerHTML = `<strong>${index + 1}. ${question.category || "general"}</strong><small>${question.level || "easy"} · ${question.question_id}</small>`;
    button.addEventListener("click", () => {
      state.current = question;
      state.startedAt ||= Date.now();
      state.replayCount = 0;
      renderQuestionList();
      renderExercise();
    });
    list.append(button);
  });

  if (!state.current || state.current.mode !== state.mode) {
    state.current = questions[0];
    state.startedAt ||= Date.now();
    renderQuestionList();
    renderExercise();
  }
}

function renderExercise() {
  const panel = $("#exercisePanel");
  const q = state.current;
  if (!q) {
    panel.innerHTML = "<p>Select a practice mode to begin.</p>";
    return;
  }

  const choices = parseChoices(q.choices);
  const isListening = q.mode === "listening_practice";
  const isSpeaking = q.mode === "speaking_practice";
  const isSentence = q.mode === "sentence_builder";

  panel.innerHTML = `
    <p class="eyebrow">${q.mode.replace("_", " ")} · ${q.category || ""}</p>
    <h3 class="prompt">${q.prompt || q.speaking_prompt || "Practice this item"}</h3>
    ${isListening ? renderListeningControls(q) : ""}
    ${isSentence ? renderSentenceBuilder(q) : ""}
    ${isSpeaking ? renderSpeaking(q) : renderChoices(choices)}
    <div class="exercise-actions">
      ${isSpeaking || isSentence ? '<button id="submitTextBtn" class="primary">Submit Answer</button>' : ""}
      <button id="finishLessonBtn" class="secondary">Finish Lesson</button>
    </div>
    <div id="feedback" class="feedback" hidden></div>
    <p id="transcript" class="transcript"><strong>Transcript:</strong> ${q.audio_script || q.answer}</p>
  `;

  if (!isSpeaking && !isSentence) {
    panel.querySelectorAll(".choice").forEach((button) => {
      button.addEventListener("click", () => gradeChoice(button.textContent));
    });
  }

  $("#listenBtn")?.addEventListener("click", () => speak(q.audio_script || q.answer));
  $("#replayBtn")?.addEventListener("click", () => {
    state.replayCount += 1;
    speak(q.audio_script || q.answer);
  });
  $("#recordBtn")?.addEventListener("click", startSpeechCapture);
  $("#submitTextBtn")?.addEventListener("click", () => gradeTextAnswer());
  $("#finishLessonBtn").addEventListener("click", finishLesson);
}

function renderChoices(choices) {
  if (!choices.length) return `<textarea id="textAnswer" rows="4" placeholder="Type your answer"></textarea>`;
  return `<div class="choices">${choices.map((choice) => `<button class="choice">${choice}</button>`).join("")}</div>`;
}

function renderListeningControls(q) {
  return `
    <div class="inline-control">
      <select id="speedSelect" aria-label="Listening speed">
        <option value="0.6">0.6x Very Slow</option>
        <option value="0.75" selected>0.75x Slow</option>
        <option value="1">1.0x Normal</option>
        <option value="1.25">1.25x Fast</option>
      </select>
      <button id="listenBtn" class="primary">Listen</button>
      <button id="replayBtn" class="secondary">Replay</button>
    </div>
    <p class="status-line">Progressive listening: try 0.75x, then 1.0x, then 1.25x.</p>
  `;
}

function renderSentenceBuilder(q) {
  const chunks = (q.choices ? parseChoices(q.choices) : String(q.answer || "").split(" ")).filter(Boolean);
  return `
    <div class="chunk-box">${chunks.map((chunk) => `<button class="chunk" type="button">${chunk}</button>`).join("")}</div>
    <textarea id="textAnswer" rows="3" placeholder="Arrange the sentence here"></textarea>
  `;
}

function renderSpeaking(q) {
  return `
    <p>${q.speaking_prompt || "Reply by voice in English or Chinese, then review the transcript before submitting."}</p>
    <div class="exercise-actions">
      <button id="recordBtn" class="primary">Record</button>
    </div>
    <textarea id="textAnswer" rows="5" placeholder="Speech transcript will appear here. Edit before submitting."></textarea>
  `;
}

function speak(text) {
  if (!window.speechSynthesis || !text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = /[\u4e00-\u9fff]/.test(text) ? "zh-CN" : "en-US";
  utterance.rate = Number($("#speedSelect")?.value || 1);
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function startSpeechCapture() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showFeedback(false, "Speech recognition is not available in this browser. You can type your answer instead.");
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    $("#textAnswer").value = event.results[0][0].transcript;
  };
  recognition.start();
}

function gradeChoice(answer) {
  const q = state.current;
  const correct = normalize(answer) === normalize(q.answer);
  document.querySelectorAll(".choice").forEach((button) => {
    if (normalize(button.textContent) === normalize(q.answer)) button.classList.add("correct");
    if (button.textContent === answer && !correct) button.classList.add("wrong");
  });
  recordAnswer(q, answer, correct, correct ? 100 : 0);
  showFeedback(correct, q.explanation || "");
}

function gradeTextAnswer() {
  const q = state.current;
  const answer = $("#textAnswer")?.value || "";
  const keywords = String(q.keywords || "").split(",").map((k) => normalize(k)).filter(Boolean);
  const keywordHits = keywords.filter((keyword) => normalize(answer).includes(keyword)).length;
  const keywordScore = keywords.length ? keywordHits / keywords.length : 0;
  const directMatch = normalize(answer) === normalize(q.answer);
  const score = directMatch ? 100 : Math.round(keywordScore * 70);
  const correct = score >= 70;
  recordAnswer(q, answer, correct, score);
  showFeedback(correct, q.explanation || `Expected: ${q.answer}`);
}

function recordAnswer(question, userAnswer, correct, score) {
  state.streak = correct ? state.streak + 1 : 0;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.answers.push({
    question,
    userAnswer,
    correct,
    score,
    replayCount: state.replayCount,
    selectedSpeed: $("#speedSelect")?.value || ""
  });
}

function showFeedback(correct, text) {
  const feedback = $("#feedback");
  feedback.hidden = false;
  feedback.style.borderLeftColor = correct ? "var(--ok)" : "var(--bad)";
  feedback.innerHTML = `<strong>${correct ? "Correct" : "Review this one"}</strong><p>${text}</p>`;
  $("#transcript")?.classList.add("visible");
}

async function finishLesson() {
  const answers = state.answers;
  const total = answers.length;
  const correct = answers.filter((item) => item.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const score = total ? Math.round(answers.reduce((sum, item) => sum + item.score, 0) / total) : 0;
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
  const endedAt = Date.now();
  const breakdown = buildBreakdown(answers);
  const weakest = findWeakestMode(breakdown);
  const session = {
    session_id: makeId("session"),
    user_id: "default_user",
    started_at: state.startedAt ? new Date(state.startedAt).toISOString() : new Date().toISOString(),
    ended_at: new Date(endedAt).toISOString(),
    lesson_id: state.mode,
    category: state.current?.category || "",
    level: state.current?.level || "",
    total_questions: total,
    correct_count: correct,
    incorrect_count: total - correct,
    accuracy_percentage: accuracy,
    score,
    stars_earned: stars,
    time_spent: state.startedAt ? Math.round((endedAt - state.startedAt) / 1000) : 0,
    best_streak: state.bestStreak,
    vocab_score: breakdown.vocab_quiz || "",
    sentence_score: breakdown.sentence_builder || "",
    email_score: breakdown.email_practice || "",
    scenario_score: breakdown.scenario_roleplay || "",
    listening_score: breakdown.listening_practice || "",
    speaking_score: breakdown.speaking_practice || "",
    weakest_skill: weakest,
    recommended_next_mode: recommendation(weakest, breakdown)
  };

  await api("appendGameSession", session);
  for (const item of answers.filter((answer) => !answer.correct)) {
    await api("appendReviewQueue", {
      review_id: makeId("review"),
      user_id: "default_user",
      question_id: item.question.question_id,
      source_id: item.question.source_id,
      mode: item.question.mode,
      mistake_type: mistakeType(item.question.mode),
      user_answer: item.userAnswer,
      correct_answer: item.question.answer,
      last_attempted_at: nowBangkok(),
      retry_count: 0,
      status: "active"
    });
  }

  renderSummary(session, answers);
  switchView("summary");
}

function buildBreakdown(answers) {
  return Object.fromEntries(MODES.map(([mode]) => {
    const items = answers.filter((answer) => answer.question.mode === mode);
    if (!items.length) return [mode, ""];
    return [mode, Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length)];
  }));
}

function findWeakestMode(breakdown) {
  return Object.entries(breakdown).filter(([, score]) => score !== "").sort((a, b) => a[1] - b[1])[0]?.[0] || state.mode;
}

function recommendation(mode, breakdown) {
  if (breakdown.listening_practice !== "" && breakdown.listening_practice < 70) return "Listening Practice at 0.75x speed";
  if (breakdown.speaking_practice !== "" && breakdown.speaking_practice < 70) return "Speaking Practice with transcript review";
  if (mode === "vocab_quiz") return "Vocabulary Quiz before Sentence Builder";
  if (mode === "email_practice") return "Email Practice and Scenario Roleplay";
  return MODES.find(([id]) => id === mode)?.[1] || "Vocabulary Quiz";
}

function mistakeType(mode) {
  return {
    vocab_quiz: "vocab_meaning",
    sentence_builder: "grammar_order",
    email_practice: "email_phrase",
    scenario_roleplay: "scenario_context",
    listening_practice: "listening_keyword",
    speaking_practice: "speaking_keyword"
  }[mode] || "vocab_meaning";
}

function renderSummary(session, answers) {
  const panel = $("#summaryPanel");
  const level = session.accuracy_percentage >= 90 ? "Excellent" : session.accuracy_percentage >= 75 ? "Good" : session.accuracy_percentage >= 60 ? "Needs Practice" : "Review Recommended";
  const wrong = answers.filter((item) => !item.correct);
  panel.innerHTML = `
    <div class="summary-card"><span>Score</span><strong>${session.score}</strong></div>
    <div class="summary-card"><span>Accuracy</span><strong>${session.accuracy_percentage}%</strong></div>
    <div class="summary-card"><span>Stars</span><strong>${"★".repeat(session.stars_earned) || "Try again"}</strong></div>
    <div class="summary-card"><span>Performance</span><strong>${level}</strong></div>
    <div class="summary-card"><span>Best streak</span><strong>${session.best_streak}</strong></div>
    <div class="summary-card"><span>Next mode</span><strong>${session.recommended_next_mode}</strong></div>
    <div class="summary-card wrong-list">
      <h3>Incorrect answers</h3>
      ${wrong.length ? wrong.map((item) => `<p><strong>${item.question.prompt}</strong><br>Your answer: ${item.userAnswer}<br>Correct: ${item.question.answer}<br>${item.question.explanation || ""}</p>`).join("") : "<p>No incorrect answers in this session.</p>"}
    </div>
  `;
}

async function loadQuestions() {
  const result = await api("listApprovedQuestions");
  state.questions = result.rows || [];
  state.current = null;
  state.answers = [];
  state.startedAt = null;
  renderModes();
  renderQuestionList();
  renderExercise();
}

function setupEvents() {
  $("#endpointInput").value = state.endpoint;
  $("#saveEndpointBtn").addEventListener("click", () => {
    state.endpoint = $("#endpointInput").value.trim();
    localStorage.setItem("trainerEndpoint", state.endpoint);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  $("#contentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const row = {
      id: makeId("raw"),
      created_at: nowBangkok(),
      input_type: $("#inputType").value,
      thai_input: $("#thaiInput").value.trim(),
      context_note: $("#contextNote").value.trim(),
      category_hint: $("#categoryHint").value,
      level_hint: $("#levelHint").value,
      status: "new",
      notes: ""
    };
    if (!row.context_note) {
      $("#addStatus").textContent = "Context note is required because logistics Thai can be ambiguous.";
      return;
    }
    await api("appendRawInput", row);
    $("#contentForm").reset();
    $("#inputType").value = "sentence";
    $("#addStatus").textContent = `Saved ${row.id} to Raw_Input.`;
  });

  $("#reloadQuestionsBtn").addEventListener("click", loadQuestions);
  $("#retryBtn").addEventListener("click", () => {
    state.answers = [];
    state.startedAt = Date.now();
    switchView("practice");
  });
}

setupEvents();
loadQuestions().catch((error) => {
  $("#exercisePanel").innerHTML = `<p>${error.message}</p>`;
});
