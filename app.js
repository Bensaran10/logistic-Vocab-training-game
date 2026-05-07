const MODES = [
  ["vocab_quiz", "Vocabulary"],
  ["sentence_builder", "Sentence Builder"],
  ["email_practice", "Email"],
  ["listening_practice", "Listening"],
  ["speaking_practice", "Speaking"]
];

const MODE_DESCRIPTIONS = {
  vocab_quiz: "จำความหมายคำศัพท์ logistics",
  sentence_builder: "เรียงประโยค English/Chinese ให้ถูก",
  email_practice: "เขียนอีเมลหรือคำตอบสถานการณ์งานจริง",
  listening_practice: "ฟังประโยคและตอบความเข้าใจ",
  speaking_practice: "พูดหรือตรวจ transcript ก่อนส่ง"
};

const VOCAB_DETAILS = [
  {
    source_id: "seed_basic_001",
    zh: "清关",
    pinyin: "qīngguān",
    en: "customs clearance",
    th: "พิธีการศุลกากร / การเคลียร์ศุลกากร",
    category: "customs",
    level: "easy"
  },
  {
    source_id: "seed_basic_002",
    zh: "货物",
    pinyin: "huòwù",
    en: "shipment",
    th: "สินค้า / ล็อตสินค้าที่ขนส่ง",
    category: "delivery",
    level: "easy"
  },
  {
    source_id: "seed_basic_003",
    zh: "发票",
    pinyin: "fāpiào",
    en: "invoice",
    th: "ใบแจ้งหนี้ / invoice",
    category: "documents",
    level: "easy"
  },
  {
    source_id: "seed_basic_004",
    zh: "装箱单",
    pinyin: "zhuāngxiāng dān",
    en: "packing list",
    th: "ใบรายการบรรจุสินค้า",
    category: "documents",
    level: "easy"
  },
  {
    source_id: "seed_basic_005",
    zh: "送货时间",
    pinyin: "sònghuò shíjiān",
    en: "delivery time",
    th: "เวลาจัดส่ง",
    category: "delivery",
    level: "easy"
  },
  {
    source_id: "seed_basic_006",
    zh: "延迟",
    pinyin: "yánchí",
    en: "delay",
    th: "ล่าช้า / ความล่าช้า",
    category: "problem_solving",
    level: "easy"
  },
  {
    source_id: "seed_basic_007",
    zh: "提单",
    pinyin: "tídān",
    en: "bill of lading",
    th: "ใบตราส่งสินค้า / B/L",
    category: "documents",
    level: "medium"
  },
  {
    source_id: "seed_basic_008",
    zh: "司机",
    pinyin: "sījī",
    en: "driver",
    th: "คนขับรถ",
    category: "delivery",
    level: "easy"
  },
  {
    source_id: "seed_basic_009",
    zh: "缺少文件",
    pinyin: "quēshǎo wénjiàn",
    en: "missing documents",
    th: "เอกสารไม่ครบ",
    category: "documents",
    level: "easy"
  }
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
  vocabType: "zh",
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
  if (action === "appendEmailSubmission") {
    const rows = JSON.parse(localStorage.getItem("emailSubmissions") || "[]");
    rows.push(payload);
    localStorage.setItem("emailSubmissions", JSON.stringify(rows));
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

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function approvedVocabItems() {
  const approvedSourceIds = new Set(
    state.questions
      .filter((question) => question.mode === "vocab_quiz")
      .map((question) => question.source_id)
  );
  const matched = VOCAB_DETAILS.filter((item) => approvedSourceIds.has(item.source_id));
  return matched.length ? matched : (state.endpoint ? [] : VOCAB_DETAILS);
}

function makeVocabQuestion(item, type) {
  const isChinese = type === "zh";
  const answer = isChinese ? `${item.th} / ${item.en}` : `${item.th} / ${item.zh}`;
  const distractors = shuffle(approvedVocabItems().filter((candidate) => candidate.source_id !== item.source_id))
    .slice(0, 3)
    .map((candidate) => isChinese ? `${candidate.th} / ${candidate.en}` : `${candidate.th} / ${candidate.zh}`);

  return {
    question_id: `random_${type}_${item.source_id}_${Date.now()}`,
    source_id: item.source_id,
    mode: "vocab_quiz",
    prompt: isChinese ? "คำศัพท์จีนนี้หมายความว่าอะไร?" : "คำศัพท์อังกฤษนี้หมายความว่าอะไร?",
    choices: shuffle([answer, ...distractors]).join("|"),
    answer,
    explanation: isChinese
      ? `${item.zh} (${item.pinyin}) แปลว่า ${item.th} หรือ ${item.en}`
      : `${item.en} แปลว่า ${item.th} ภาษาจีนคือ ${item.zh} (${item.pinyin})`,
    audio_script: isChinese ? item.zh : item.en,
    speaking_prompt: "",
    keywords: `${item.zh}, ${item.pinyin}, ${item.en}, ${item.th}`,
    language: isChinese ? "zh-th-en" : "en-th-zh",
    category: item.category,
    level: item.level,
    vocab_display: isChinese ? item.zh : item.en,
    vocab_pinyin: item.pinyin,
    vocab_audio: isChinese ? item.zh : item.en,
    vocab_type: type
  };
}

function pickRandomVocabQuestion() {
  const items = approvedVocabItems();
  if (!items.length) return null;
  const item = shuffle(items)[0];
  state.current = makeVocabQuestion(item, state.vocabType);
  state.startedAt ||= Date.now();
  state.replayCount = 0;
  return state.current;
}

function questionsForMode(mode) {
  if (mode === "email_practice") {
    return state.questions.filter((question) => question.mode === "email_practice" || question.mode === "scenario_roleplay");
  }
  return state.questions.filter((question) => question.mode === mode);
}

function pickRandomPracticeQuestion(mode = state.mode) {
  if (mode === "vocab_quiz") return pickRandomVocabQuestion();

  const questions = questionsForMode(mode);
  if (!questions.length) {
    state.current = null;
    return null;
  }

  const pool = questions.length > 1 && state.current
    ? questions.filter((question) => question.question_id !== state.current.question_id)
    : questions;
  state.current = shuffle(pool)[0];
  state.startedAt ||= Date.now();
  state.replayCount = 0;
  return state.current;
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
    button.innerHTML = `<span>${label}</span><small>${MODE_DESCRIPTIONS[id]}</small>`;
    button.addEventListener("click", () => {
      state.mode = id;
      state.current = null;
      pickRandomPracticeQuestion(id);
      renderModes();
      renderQuestionList();
      renderExercise();
    });
    picker.append(button);
  });
}

function renderQuestionList() {
  const list = $("#questionList");
  if (state.mode === "vocab_quiz") {
    const items = approvedVocabItems();
    list.innerHTML = `
      <div class="vocab-control">
        <p class="eyebrow">Random vocabulary</p>
        <strong>สุ่มคำศัพท์อัตโนมัติ</strong>
        <p>ไม่ต้องเลือกข้อจากรายการ ระบบจะสุ่มคำใหม่ทุกครั้งที่กด Next Random Word</p>
        <div class="segmented">
          <button class="${state.vocabType === "zh" ? "active" : ""}" data-vocab-type="zh">คำศัพท์จีน</button>
          <button class="${state.vocabType === "en" ? "active" : ""}" data-vocab-type="en">คำศัพท์อังกฤษ</button>
        </div>
        <button id="nextVocabBtn" class="primary">Next Random Word</button>
        <small>${items.length} approved vocabulary items available</small>
      </div>
    `;
    list.querySelectorAll("[data-vocab-type]").forEach((button) => {
      button.addEventListener("click", () => {
        state.vocabType = button.dataset.vocabType;
        pickRandomVocabQuestion();
        renderQuestionList();
        renderExercise();
      });
    });
    $("#nextVocabBtn").addEventListener("click", () => {
      pickRandomVocabQuestion();
      renderExercise();
    });
    if (!state.current || state.current.mode !== "vocab_quiz") pickRandomVocabQuestion();
    return;
  }

  const questions = questionsForMode(state.mode);
  const modeLabel = MODES.find(([id]) => id === state.mode)?.[1] || "Practice";
  list.innerHTML = "";

  if (!questions.length) {
    list.innerHTML = `<div class="question-row"><strong>No approved questions yet</strong><small>Use the review sheet to approve generated items.</small></div>`;
    return;
  }

  if (!state.current || state.current.mode !== state.mode) pickRandomPracticeQuestion(state.mode);

  list.innerHTML = `
    <div class="vocab-control">
      <p class="eyebrow">Random ${modeLabel}</p>
      <strong>Random question mode</strong>
      <p>This mode picks a random approved question. Use the button below for the next random question.</p>
      <button id="nextRandomQuestionBtn" class="primary">Next Random Question</button>
      <small>${questions.length} approved questions available</small>
      ${state.current ? `<small>Current: ${state.current.category || "general"} - ${state.current.level || "easy"}</small>` : ""}
    </div>
  `;

  $("#nextRandomQuestionBtn").addEventListener("click", () => {
    pickRandomPracticeQuestion(state.mode);
    renderQuestionList();
    renderExercise();
  });
  return;

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
    panel.innerHTML = `
      <p class="eyebrow">Start here</p>
      <h3 class="prompt">Select a practice mode to begin.</h3>
      <p>ถ้ายังไม่มีคำถาม ให้ไปที่ Google Sheet แล้วตรวจว่าแท็บ Approved_Questions มีคำถามแล้ว จากนั้นกด Reload approved questions</p>
    `;
    return;
  }

  const choices = parseChoices(q.choices);
  const isListening = q.mode === "listening_practice";
  const isSpeaking = q.mode === "speaking_practice";
  const isSentence = q.mode === "sentence_builder";
  const isVocab = q.mode === "vocab_quiz";
  const isEmailWriting = state.mode === "email_practice";

  if (isVocab) {
    renderVocabExercise(q);
    return;
  }

  if (isEmailWriting) {
    renderEmailWritingExercise(q);
    return;
  }

  panel.innerHTML = `
    <p class="eyebrow">${q.mode.replace("_", " ")} · ${q.category || ""}</p>
    <h3 class="prompt">${q.prompt || q.speaking_prompt || "Practice this item"}</h3>
    ${isListening ? renderListeningControls(q) : ""}
    ${isSentence ? renderSentenceBuilder(q) : ""}
    ${isSpeaking ? renderSpeaking(q) : renderChoices(choices)}
    <div class="exercise-actions">
      ${isSpeaking || isSentence ? '<button id="submitTextBtn" class="primary">Submit Answer</button>' : ""}
      <button id="nextPracticeQuestionBtn" class="primary">Next Random Question</button>
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
  $("#nextPracticeQuestionBtn")?.addEventListener("click", () => {
    pickRandomPracticeQuestion(state.mode);
    renderQuestionList();
    renderExercise();
  });
  $("#finishLessonBtn").addEventListener("click", finishLesson);
}

function renderEmailWritingExercise(q) {
  const panel = $("#exercisePanel");
  panel.innerHTML = `
    <p class="eyebrow">Email & Scenario Writing · ${q.category || ""}</p>
    <h3 class="prompt">${q.prompt || "Write a practical reply for this logistics situation."}</h3>
    <div class="description-band compact">
      <strong>พิมพ์ตอบเป็นภาษาอังกฤษหรือภาษาจีน</strong>
      <p>ระบบจะบันทึกคำตอบไว้ใน Google Sheet แท็บ Email_Submissions แล้ว AI จะตรวจความตรงประเด็น ให้คะแนน และเขียน feedback ในรอบวันจันทร์ 12:00</p>
    </div>
    <label>
      Your email / reply
      <textarea id="emailAnswer" rows="8" placeholder="Type your reply in English or Chinese..."></textarea>
    </label>
    <details class="hint-box">
      <summary>Show reference answer</summary>
      <p>${q.answer || ""}</p>
      ${q.audio_script ? `<p>${q.audio_script}</p>` : ""}
    </details>
    <div class="exercise-actions">
      <button id="submitEmailBtn" class="primary">Submit for AI Review</button>
      <button id="nextPracticeQuestionBtn" class="secondary">Next Random Question</button>
      <button id="finishLessonBtn" class="secondary">Finish Lesson</button>
    </div>
    <div id="feedback" class="feedback" hidden></div>
  `;

  $("#submitEmailBtn").addEventListener("click", () => submitEmailAnswer(q));
  $("#nextPracticeQuestionBtn").addEventListener("click", () => {
    pickRandomPracticeQuestion(state.mode);
    renderQuestionList();
    renderExercise();
  });
  $("#finishLessonBtn").addEventListener("click", finishLesson);
}

async function submitEmailAnswer(q) {
  const answer = $("#emailAnswer").value.trim();
  if (!answer) {
    showFeedback(false, "Please type your email or reply before submitting.");
    return;
  }

  const submission = {
    submission_id: makeId("email"),
    user_id: "default_user",
    created_at: nowBangkok(),
    question_id: q.question_id,
    source_id: q.source_id,
    prompt: q.prompt || "",
    expected_answer: q.answer || "",
    user_answer: answer,
    language: /[\u4e00-\u9fff]/.test(answer) ? "zh" : "en",
    category: q.category || "",
    level: q.level || "",
    status: "needs_ai_review",
    ai_score: "",
    ai_feedback: "",
    ai_suggested_answer: "",
    reviewed_at: ""
  };

  await api("appendEmailSubmission", submission);
  showFeedback(true, "Saved to Email_Submissions. AI will review this answer during the Monday 12:00 scheduled run.");
}

function renderVocabExercise(q) {
  const panel = $("#exercisePanel");
  const choices = parseChoices(q.choices);
  const isChinese = state.vocabType === "zh";
  panel.innerHTML = `
    <p class="eyebrow">Vocabulary · ${isChinese ? "Chinese word" : "English word"} · ${q.category || ""}</p>
    <h3 class="prompt">${q.prompt}</h3>
    <div class="vocab-card">
      <span class="vocab-word">${q.vocab_display || q.audio_script}</span>
      ${isChinese ? `<span class="pinyin">${q.vocab_pinyin || ""}</span>` : ""}
      <button id="vocabSpeakBtn" class="speaker-button" title="Listen to pronunciation">Listen</button>
    </div>
    <p class="status-line">
      ${isChinese ? "โจทย์คำศัพท์จีน: มี pinyin และช้อยคำตอบเป็นไทย / อังกฤษ" : "โจทย์คำศัพท์อังกฤษ: ช้อยคำตอบเป็นไทย / ภาษาจีน"}
    </p>
    ${renderChoices(choices)}
    <div class="exercise-actions">
      <button id="nextVocabInPanelBtn" class="primary">Next Random Word</button>
      <button id="finishLessonBtn" class="secondary">Finish Lesson</button>
    </div>
    <div id="feedback" class="feedback" hidden></div>
    <p id="transcript" class="transcript"><strong>Vocabulary:</strong> ${q.vocab_display || q.audio_script}${isChinese ? ` · ${q.vocab_pinyin || ""}` : ""}</p>
  `;

  panel.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => gradeChoice(button.textContent));
  });
  $("#vocabSpeakBtn").addEventListener("click", () => speak(q.vocab_audio || q.audio_script, isChinese ? "zh-CN" : "en-US"));
  $("#nextVocabInPanelBtn").addEventListener("click", () => {
    pickRandomVocabQuestion();
    renderQuestionList();
    renderExercise();
  });
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

function speak(text, langOverride) {
  if (!window.speechSynthesis || !text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langOverride || (/[\u4e00-\u9fff]/.test(text) ? "zh-CN" : "en-US");
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
  const nextButton = document.createElement("button");
  nextButton.className = "secondary";
  nextButton.textContent = q.mode === "vocab_quiz" ? "Next Random Word" : "Next Random Question";
  nextButton.addEventListener("click", () => {
    pickRandomPracticeQuestion(state.mode);
    renderQuestionList();
    renderExercise();
  });
  $("#feedback").append(nextButton);
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
  const nextButton = document.createElement("button");
  nextButton.className = "secondary";
  nextButton.textContent = "Next Random Question";
  nextButton.addEventListener("click", () => {
    pickRandomPracticeQuestion(state.mode);
    renderQuestionList();
    renderExercise();
  });
  $("#feedback").append(nextButton);
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

function renderEmptySummary() {
  $("#summaryPanel").innerHTML = `
    <div class="summary-card wrong-list">
      <h3>ยังไม่มีผลการฝึก</h3>
      <p>ไปที่หน้า Practice เลือกโหมดฝึก ตอบคำถาม แล้วกด Finish Lesson เพื่อดูคะแนน สรุปจุดอ่อน และคำแนะนำสำหรับรอบต่อไป</p>
    </div>
  `;
}

async function loadQuestions() {
  const result = await api("listApprovedQuestions");
  state.questions = result.rows || [];
  state.current = null;
  state.answers = [];
  state.startedAt = null;
  pickRandomPracticeQuestion(state.mode);
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
renderEmptySummary();
loadQuestions().catch((error) => {
  $("#exercisePanel").innerHTML = `<p>${error.message}</p>`;
});
