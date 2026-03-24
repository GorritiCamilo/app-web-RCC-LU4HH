const MORSE_MAP = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",
  "/": "-..-.",
};

const STORAGE_KEY = "cw-frontend-koch";

const SETTING_DEFS = {
  exerciseType: {
    title: "Tipo de ejercicio",
    options: [
      "Koch (secuencia G4FON)",
      "Koch (secuencia LCWO)",
      "Koch (caracteres de cadena personalizada)",
      "Cadena personalizada",
      "Palabras de cadena personalizada",
      "Palabras con cadena personalizada [VAR]",
      "Koch entrenamiento en palabras",
      "Indicativos [PRO]",
      "Estandar QSO [PRO]",
    ],
  },
  wpm: { title: "WPM", options: ["14", "15", "18", "20", "25", "30"] },
  unit: { title: "Unidad de velocidad", options: ["WPM", "CPM"] },
  duration: {
    title: "Duracion del ejercicio",
    options: ["Ilimitado [PRO]", "10 segundos", "30 segundos", "1 minuto", "2 minutos", "3 minutos", "5 minutos", "10 minutos", "15 minutos [PRO]"],
  },
  wordLength: {
    title: "Longitud de palabra",
    options: ["Variable", "1 letra", "2 letras", "3 letras", "4 letras", "5 letras", "6 letras", "7 letras", "8 letras"],
  },
  kochLevel: {
    title: "Koch nivel",
    options: ["K M", "K M U", "K M U R", "K M U R E", "K M U R E S", "K M U R E S N", "K M U R E S N A", "K M U R E S N A P", "K M U R E S N A P T L O W I . J Z"],
  },
  hardLetters: {
    title: "Hard letters",
    options: ["A E I O U", "K M U R E", "B C F H J", "L P Q V X", "0 1 2 3 4 5 6 7 8 9"],
  },
  customChain: {
    title: "Establecer cadena personalizada",
    isText: true,
    placeholder: "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ1234567890/.,",
  },
  spaceChars: { title: "Espaciado entre caracteres", options: ["1.0 X", "1.4 X", "1.8 X", "2.1 X", "3.0 X"] },
  spaceWords: { title: "Espaciado entre palabras", options: ["1.0 X", "1.9 X", "2.0 X", "2.7 X"] },
  startPause: { title: "Iniciar pausa", options: ["0", "1", "2", "3"] },
  ratio: { title: "Relacion tablero / punto", options: ["2.8 X", "3.0 X", "3.5 X"] },
  frequency: { title: "Sidetone frecuencia", options: ["600 Hz", "700 Hz", "750 Hz", "800 Hz"] },
  dotPitch: { title: "Campo de puntos", options: ["Igual que el tablero", "2% mas alto", "4% mas alto", "5% mas alto", "10% mas alto"] },
  attack: { title: "Ataque de tono", options: ["2", "4", "8"] },
  voiceMode: { title: "Modo de voz", options: ["Ningun discurso", "ITU ortografia fonetica", "Ortografia de letras cortas [PRO]", "Text-To-Speech palabras que leen [PRO]"] },
  talkBefore: { title: "Tiempo antes de hablar", options: ["1.5", "2.0", "2.5"] },
  talkAfter: { title: "Tiempo despues de hablar", options: ["0.0", "0.5", "1.0"] },
};

const DEFAULT_SETTINGS = {
  exerciseType: "Koch (secuencia G4FON)",
  wpm: "14",
  unit: "WPM",
  duration: "10 minutos",
  wordLength: "5 letras",
  kochLevel: "K M U R E",
  hardLetters: "K M U R E",
  autoHard: true,
  customChain: "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ1234567890/.,",
  spaceChars: "1.4 X",
  spaceWords: "1.9 X",
  startPause: "1",
  ratio: "3.0 X",
  frequency: "700 Hz",
  dotPitch: "Igual que el tablero",
  attack: "2",
  voiceMode: "ITU ortografia fonetica",
  talkBefore: "2.0",
  talkAfter: "0.5",
};

const elements = {
  screens: [...document.querySelectorAll(".screen")],
  openSettingsBtn: document.querySelector("#open-settings-btn"),
  openProfileBtn: document.querySelector("#open-profile-btn"),
  startSessionBtn: document.querySelector("#start-session-btn"),
  pickSessionBtn: document.querySelector("#pick-session-btn"),
  replaySessionBtn: document.querySelector("#replay-session-btn"),
  playSessionBtn: document.querySelector("#play-session-btn"),
  newSessionSequenceBtn: document.querySelector("#new-session-sequence-btn"),
  checkSessionBtn: document.querySelector("#check-session-btn"),
  showSessionBtn: document.querySelector("#show-session-btn"),
  sessionAnswer: document.querySelector("#session-answer"),
  sessionFeedback: document.querySelector("#session-feedback"),
  sessionSummaryTitle: document.querySelector("#session-summary-title"),
  sessionSummaryValue: document.querySelector("#session-summary-value"),
  sessionSummaryMeta: document.querySelector("#session-summary-meta"),
  statSessions: document.querySelector("#stat-sessions"),
  statAccuracy: document.querySelector("#stat-accuracy"),
  statLastExercise: document.querySelector("#stat-last-exercise"),
  toggleAutoHard: document.querySelector("#toggle-autoHard"),
  referenceGrid: document.querySelector("#reference-grid"),
  settingButtons: [...document.querySelectorAll("[data-setting]")],
  backButtons: [...document.querySelectorAll("[data-back-screen]")],
  settingModal: document.querySelector("#setting-modal"),
  modalTitle: document.querySelector("#modal-title"),
  modalOptions: document.querySelector("#modal-options"),
  modalCancelBtn: document.querySelector("#modal-cancel-btn"),
  modalAcceptBtn: document.querySelector("#modal-accept-btn"),
};

const state = {
  audioContext: null,
  activeTimeouts: [],
  currentScreen: "home",
  currentSetting: "",
  modalValue: "",
  currentSequence: "",
  progress: loadState().progress,
  settings: loadState().settings,
};

function loadState() {
  const fallback = {
    settings: { ...DEFAULT_SETTINGS },
    progress: { sessions: 0, attempts: 0, hits: 0, lastExercise: "Sin datos" },
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      settings: { ...DEFAULT_SETTINGS, ...(saved?.settings || {}) },
      progress: { ...fallback.progress, ...(saved?.progress || {}) },
    };
  } catch {
    return fallback;
  }
}

function persistState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ settings: state.settings, progress: state.progress }),
  );
}

function setScreen(screenName) {
  state.currentScreen = screenName;
  elements.screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === screenName);
  });
}

function renderSettings() {
  Object.keys(SETTING_DEFS).forEach((key) => {
    const node = document.querySelector(`#value-${key}`);
    if (!node) return;
    node.textContent = state.settings[key];
  });

  elements.toggleAutoHard.checked = state.settings.autoHard;
}

function renderStats() {
  const accuracy =
    state.progress.attempts > 0
      ? Math.round((state.progress.hits / state.progress.attempts) * 100)
      : 0;

  elements.statSessions.textContent = String(state.progress.sessions);
  elements.statAccuracy.textContent = `${accuracy}%`;
  elements.statLastExercise.textContent = state.progress.lastExercise;
}

function renderReference() {
  elements.referenceGrid.innerHTML = "";
  Object.entries(MORSE_MAP).forEach(([char, code]) => {
    const chip = document.createElement("div");
    chip.className = "reference-chip";
    chip.innerHTML = `<strong>${char}</strong><small>${code}</small>`;
    elements.referenceGrid.appendChild(chip);
  });
}

function normalizeText(text) {
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function currentAlphabet() {
  if (state.settings.exerciseType.includes("Cadena personalizada")) {
    return normalizeText(state.settings.customChain).replace(/[^A-Z0-9/.,]/g, "");
  }

  const level = normalizeText(state.settings.kochLevel).replace(/\s+/g, "");
  return level || "KMURE";
}

function currentLength() {
  if (state.settings.wordLength === "Variable") {
    return 3 + Math.floor(Math.random() * 4);
  }

  const match = state.settings.wordLength.match(/\d+/);
  return match ? Number(match[0]) : 5;
}

function randomFrom(text) {
  return text[Math.floor(Math.random() * text.length)];
}

function buildSequence() {
  const alphabet = currentAlphabet();
  const length = currentLength();
  return Array.from({ length }, () => randomFrom(alphabet)).join("");
}

function textToMorse(text) {
  return [...normalizeText(text)]
    .map((char) => {
      if (char === " ") return "/";
      return MORSE_MAP[char] || "";
    })
    .filter(Boolean)
    .join(" ");
}

function frequencyValue() {
  const match = state.settings.frequency.match(/\d+/);
  return match ? Number(match[0]) : 700;
}

function ensureAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new window.AudioContext();
  }

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }

  return state.audioContext;
}

function clearAudioQueue() {
  state.activeTimeouts.forEach((id) => clearTimeout(id));
  state.activeTimeouts = [];
}

function unitDuration() {
  return 1200 / Number(state.settings.wpm);
}

function scheduleTone(startOffsetMs, durationMs) {
  const context = ensureAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + startOffsetMs / 1000;
  const endAt = startAt + durationMs / 1000;
  const attack = Number(state.settings.attack) / 1000;

  oscillator.type = "sine";
  oscillator.frequency.value = frequencyValue();
  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + Math.max(0.006, attack));
  gain.gain.exponentialRampToValueAtTime(0.001, endAt);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt);
}

function playMorseSequence(text) {
  clearAudioQueue();

  const morse = textToMorse(text);
  const unit = unitDuration();
  const charGap = parseFloat(state.settings.spaceChars) || 1.4;
  const wordGap = parseFloat(state.settings.spaceWords) || 1.9;
  const startPause = Number(state.settings.startPause) * 1000;
  let cursor = startPause;

  for (const symbol of morse) {
    if (symbol === ".") {
      scheduleTone(cursor, unit);
      cursor += unit * 2;
      continue;
    }

    if (symbol === "-") {
      scheduleTone(cursor, unit * 3);
      cursor += unit * 4;
      continue;
    }

    if (symbol === " ") {
      cursor += unit * charGap;
      continue;
    }

    if (symbol === "/") {
      cursor += unit * wordGap * 3;
    }
  }

  const timeoutId = window.setTimeout(() => {
    clearAudioQueue();
  }, cursor + 100);

  state.activeTimeouts.push(timeoutId);
}

function setFeedback(message, tone = "") {
  elements.sessionFeedback.textContent = message;
  elements.sessionFeedback.classList.remove("is-success", "is-warning");
  if (tone) elements.sessionFeedback.classList.add(tone);
}

function updateSessionSummary() {
  elements.sessionSummaryTitle.textContent = state.settings.exerciseType;
  elements.sessionSummaryValue.textContent = state.currentSequence || "-----";
  elements.sessionSummaryMeta.textContent = `${state.settings.wpm} ${state.settings.unit} · ${state.settings.wordLength}`;
}

function generateSession(openScreen = true) {
  state.currentSequence = buildSequence();
  elements.sessionAnswer.value = "";
  updateSessionSummary();
  setFeedback("Secuencia lista para practicar.");
  if (openScreen) setScreen("session");
}

function openSetting(key) {
  state.currentSetting = key;
  state.modalValue = state.settings[key];
  const def = SETTING_DEFS[key];
  elements.modalTitle.textContent = def.title;
  elements.modalOptions.innerHTML = "";

  if (def.isText) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = state.modalValue;
    input.placeholder = def.placeholder || "";
    input.style.width = "100%";
    input.style.padding = "10px 12px";
    input.style.border = "1px solid #ddd";
    input.style.borderRadius = "4px";
    input.addEventListener("input", (event) => {
      state.modalValue = event.target.value;
    });
    elements.modalOptions.appendChild(input);
  } else {
    def.options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "modal-option";
      label.innerHTML = `<input type="radio" name="setting-option" value="${option}" ${option === state.modalValue ? "checked" : ""} /><span>${option}</span>`;
      label.querySelector("input").addEventListener("change", (event) => {
        state.modalValue = event.target.value;
      });
      elements.modalOptions.appendChild(label);
    });
  }

  elements.settingModal.classList.remove("hidden");
}

function closeModal() {
  elements.settingModal.classList.add("hidden");
  state.currentSetting = "";
}

elements.openSettingsBtn.addEventListener("click", () => setScreen("settings"));
elements.openProfileBtn.addEventListener("click", () => setScreen("profile"));
elements.backButtons.forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.backScreen));
});

elements.startSessionBtn.addEventListener("click", () => {
  if (!state.currentSequence) {
    generateSession(true);
    return;
  }

  updateSessionSummary();
  setScreen("session");
});

elements.pickSessionBtn.addEventListener("click", () => {
  generateSession(true);
});

elements.playSessionBtn.addEventListener("click", () => {
  if (!state.currentSequence) generateSession(false);
  playMorseSequence(state.currentSequence);
});

elements.replaySessionBtn.addEventListener("click", () => {
  if (!state.currentSequence) return;
  playMorseSequence(state.currentSequence);
});

elements.newSessionSequenceBtn.addEventListener("click", () => {
  generateSession(false);
});

elements.checkSessionBtn.addEventListener("click", () => {
  if (!state.currentSequence) {
    setFeedback("Primero genera una secuencia.", "is-warning");
    return;
  }

  const answer = normalizeText(elements.sessionAnswer.value);
  const expected = normalizeText(state.currentSequence);
  const correct = answer === expected;

  state.progress.sessions += 1;
  state.progress.attempts += 1;
  state.progress.lastExercise = state.settings.exerciseType;

  if (correct) {
    state.progress.hits += 1;
    setFeedback(`Correcto. El grupo era ${expected}.`, "is-success");
  } else {
    setFeedback(`Incorrecto. Esperado: ${expected}.`, "is-warning");
  }

  persistState();
  renderStats();
});

elements.showSessionBtn.addEventListener("click", () => {
  if (!state.currentSequence) {
    setFeedback("No hay grupo activo.", "is-warning");
    return;
  }

  setFeedback(`Grupo visible: ${state.currentSequence}.`);
});

elements.settingButtons.forEach((button) => {
  button.addEventListener("click", () => openSetting(button.dataset.setting));
});

elements.toggleAutoHard.addEventListener("change", () => {
  state.settings.autoHard = elements.toggleAutoHard.checked;
  persistState();
});

elements.modalCancelBtn.addEventListener("click", () => closeModal());
elements.modalAcceptBtn.addEventListener("click", () => {
  if (state.currentSetting) {
    state.settings[state.currentSetting] = state.modalValue;
    persistState();
    renderSettings();
    updateSessionSummary();
  }

  closeModal();
});

elements.settingModal.addEventListener("click", (event) => {
  if (event.target === elements.settingModal) closeModal();
});

renderSettings();
renderStats();
renderReference();
generateSession(false);
