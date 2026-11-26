import { gradeJavaLesson } from "./submission-grading.js";
import { runTeachingPreview } from "./teaching-preview.js";

const courseGroups = window.COURSE_GROUPS || [];
const answerCode =
  'public class Main {\n' +
  '    public static void main(String[] args) {\n' +
  '        System.out.println("Hello, Java!");\n' +
  '    }\n' +
  '}\n';

const starterCode =
  'public class Main {\n' +
  '    public static void main(String[] args) {\n' +
  '        // 在这里写一行输出代码\n' +
  '    }\n' +
  '}\n';

const totalLessons = courseGroups.reduce((sum, group) => sum + group.lessons.length, 0);

const defaultLessonContent = {
  id: "hello-java",
  title: "你好 Java (Hello World)",
  subtitle: "输出第一句话",
  intro: [
    "Java 是一门适合长期学习的编程语言，常用于后端服务、企业系统、安卓生态、数据处理和大型工程。",
    "这一关只解决一个问题：把代码写进编辑器，运行后在控制台看到一行输出。"
  ],
  syntax: [
    "`public class Main` 定义一个叫 Main 的类，可以先理解成程序盒子。",
    "`public static void main(String[] args)` 是程序入口，Java 会从这里开始执行。",
    "`System.out.println()` 会在控制台打印一行文字。",
    "双引号里的内容是字符串，分号表示这句代码结束。"
  ],
  exampleCode:
    'public class Main {\n' +
    '    public static void main(String[] args) {\n' +
    '        System.out.println("Hello, Java!");\n' +
    '        System.out.println(2026);\n' +
    '    }\n' +
    '}',
  task: "在右侧编辑器中写一行输出语句，让控制台显示一句你自己的话。",
  starterCode,
  answerCode,
  checks: [
    "代码包含 System.out.println(...)。",
    "println 的括号里有一段双引号包起来的文字。",
    "语句末尾写了英文分号。"
  ],
  commonMistakes: [
    "中文引号和中文分号会导致语法错误。",
    "String、System、Main 的大小写不能随意改。",
    "少写右括号或右大括号时，错误位置可能显示在下一行。"
  ],
  sources: [
    { title: "Dev.java: Getting Started with Java", url: "https://dev.java/learn/getting-started" },
    { title: "Dev.java: Single-File Source-Code Programs", url: "https://dev.java/learn/single-file-program/" },
    { title: "Oracle JDK Documentation", url: "https://docs.oracle.com/en/java/javase/26/" }
  ]
};

const levelList = document.querySelector("#levelList");
const lessonArticle = document.querySelector("#lessonArticle");
const lessonColumn = document.querySelector(".lesson-column");
const practiceColumn = document.querySelector(".practice-column");
const codeEditor = document.querySelector("#codeEditor");
const editorModeLabel = document.querySelector("#editorModeLabel");
const focusModeLabel = document.querySelector("#focusModeLabel");
const trainingApp = document.querySelector(".training-app");
const editorLines = document.querySelector("#editorLines");
const stdinInput = document.querySelector("#stdinInput");
const consoleOutput = document.querySelector("#consoleOutput");
const runMeta = document.querySelector("#runMeta");
const themeToggle = document.querySelector("#themeToggle");
const progressBar = document.querySelector("#progressBar");
const progressPercent = document.querySelector("#progressPercent");
const progressText = document.querySelector("#progressText");
const resetProgress = document.querySelector("#resetProgress");
const answerDrawer = document.querySelector("#answerDrawer");
const answerContent = document.querySelector("#answerContent");
const showAnswer = document.querySelector("#showAnswer");
const closeAnswer = document.querySelector("#closeAnswer");
const focusModal = document.querySelector("#focusModal");
const focusEditor = document.querySelector("#focusEditor");
const focusLines = document.querySelector("#focusLines");
const focusStdinInput = document.querySelector("#focusStdinInput");
const focusOutput = document.querySelector("#focusOutput");
const focusRunMeta = document.querySelector("#focusRunMeta");
const openFocusButton = document.querySelector("#focusCode");
const closeFocusButton = document.querySelector("#closeFocus");
const focusRunButton = document.querySelector("#focusRun");
const nextLessonButton = document.querySelector("#nextLesson");
const resetStorageKey = "java-path-reset-v2";
const progressStorageKey = "java-path-progress-v1";
const legacyProgressStorageKey = "java-master-completed";
const draftStorageKey = "java-path-drafts-v1";
const themeStorageKey = "java-path-theme";
const legacyThemeStorageKey = "java-master-theme";
const maxDraftLength = 20_000;
function readResetId() {
  try {
    return localStorage.getItem(resetStorageKey) ?? "";
  } catch {
    return null;
  }
}

let progressResetId = readResetId() ?? "";
let completedLessons = 0;
let currentLessonIndex = 0;
let lessonDrafts = readStoredDrafts();
const draftChanges = new Map();
const pendingRuns = new Map();
let focusHasRun = false;

function normalizeCompletedCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(totalLessons, Math.floor(numeric)));
}

function readStoredProgress() {
  try {
    const raw = localStorage.getItem(progressStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if ((parsed.resetId ?? "") !== progressResetId) return 0;
      if (Array.isArray(parsed.completedLessonIds)) {
        const completedIds = new Set(parsed.completedLessonIds.map(String));
        const lessons = getLessonContents();
        let completedCount = 0;

        while (completedCount < lessons.length && completedIds.has(lessons[completedCount]?.id)) {
          completedCount += 1;
        }

        return completedCount;
      }

      const value = Number(parsed.completedLessons);
      if (Number.isFinite(value)) return normalizeCompletedCount(value);
    }

    if (progressResetId) return 0;
    const legacyValue = Number(localStorage.getItem(legacyProgressStorageKey) || 0);
    return Number.isFinite(legacyValue) ? normalizeCompletedCount(legacyValue) : 0;
  } catch {
    return 0;
  }
}

function readStoredTheme() {
  try {
    return localStorage.getItem(themeStorageKey) || localStorage.getItem(legacyThemeStorageKey) || "light";
  } catch {
    return "light";
  }
}

function readStoredDrafts() {
  try {
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if ((parsed?.resetId ?? "") !== progressResetId) return {};
    const drafts = parsed?.drafts && typeof parsed.drafts === "object" ? parsed.drafts : {};

    return Object.fromEntries(
      Object.entries(drafts)
        .filter(([lessonId, code]) => typeof lessonId === "string" && typeof code === "string")
        .map(([lessonId, code]) => [lessonId, code.slice(0, maxDraftLength)])
    );
  } catch {
    return {};
  }
}

let writeDraftsTimeout = null;

function writeStoredDrafts(immediate = false) {
  clearTimeout(writeDraftsTimeout);
  writeDraftsTimeout = null;
  if (draftChanges.size === 0 || !syncProgressReset()) return;

  if (!immediate) {
    writeDraftsTimeout = setTimeout(() => writeStoredDrafts(true), 500);
    return;
  }

  try {
    const drafts = readStoredDrafts();
    for (const [id, code] of draftChanges) {
      if (code === null) delete drafts[id];
      else drafts[id] = code;
    }
    if (Object.keys(drafts).length > 0) {
      localStorage.setItem(draftStorageKey, JSON.stringify({ drafts, resetId: progressResetId, updatedAt: new Date().toISOString() }));
    } else {
      localStorage.removeItem(draftStorageKey);
    }
    lessonDrafts = drafts;
    draftChanges.clear();
  } catch {
    // Keep pending drafts in memory so editing works without persistent storage.
  }
}

const lessonContents = courseGroups.flatMap((group, groupIndex) => {
  const authored = window["LESSON_CONTENT_LEVEL" + (groupIndex + 1)] || [];
  return group.lessons.map((_, index) => authored[index]);
});

function getLessonContents() {
  return lessonContents;
}

function getCurrentLesson() {
  return lessonContents[currentLessonIndex] || createPlaceholderLesson(currentLessonIndex);
}

function createPlaceholderLesson(index) {
  const flatLessons = courseGroups.flatMap((group) => group.lessons);
  const lesson = flatLessons[index] || flatLessons[0];
  return {
    id: `lesson-${index + 1}`,
    title: lesson.title,
    subtitle: lesson.subtitle,
    intro: [
      "当前课程资源没有正确加载。请刷新页面；如果仍然出现这一页，说明课程脚本没有随页面一起发布。"
    ],
    syntax: ["刷新页面后，系统会重新加载对应关卡的讲解、示例、任务和官方资料。"],
    exampleCode: "",
    task: "刷新页面后继续当前关卡。",
    starterCode,
    answerCode,
    checks: ["代码可以运行。", "输出符合本关任务。"],
    commonMistakes: ["先保证程序结构完整，再逐步补业务逻辑。"],
    sources: defaultLessonContent.sources
  };
}

function isLessonLocked(index) {
  return index > completedLessons;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineCode(value) {
  return escapeHtml(value).replace(/`([^`]+)`/g, '<span class="code-pill">$1</span>');
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value), window.location.href);
    return url.protocol === "https:" ? escapeHtml(url.href) : "#";
  } catch {
    return "#";
  }
}

function renderLevels() {
  let lessonNumber = 0;
  levelList.innerHTML = courseGroups
    .map(
      (group) => `
        <section class="level-group">
          <div class="level-group-title">${escapeHtml(group.title)}</div>
          ${group.lessons
            .map((lesson) => {
              lessonNumber += 1;
              const itemIndex = lessonNumber - 1;
              const isCurrent = itemIndex === currentLessonIndex;
              const isCompleted = itemIndex < completedLessons;
              const isLocked = isLessonLocked(itemIndex);
              const status = isCurrent ? "当前" : isCompleted ? "完成" : isLocked ? "锁定" : "解锁";
              const statusClass = isCurrent ? "is-current" : isCompleted ? "is-done" : isLocked ? "is-locked" : "is-waiting";
              const statusTitle = isLocked ? "完成前一关后解锁" : isCompleted ? "已完成" : isCurrent ? "当前关卡" : "已解锁";
              const ariaLabel = `${lessonNumber}. ${lesson.title}，${statusTitle}`;
              return `
                <button class="level-item ${isCurrent ? "is-active" : ""} ${isCompleted ? "is-completed" : ""} ${isLocked ? "is-locked" : ""}" type="button" data-lesson-index="${itemIndex}" title="${escapeHtml(statusTitle)}" aria-label="${escapeHtml(ariaLabel)}" ${isLocked ? 'disabled aria-disabled="true"' : 'aria-disabled="false"'}>
                  <span class="lesson-index">${String(lessonNumber).padStart(2, "0")}</span>
                  <span class="level-copy">
                    <strong>${escapeHtml(lesson.title)}</strong>
                    <span class="level-subtitle">${escapeHtml(lesson.subtitle)}</span>
                  </span>
                  <span class="lesson-status ${statusClass}">${status}</span>
                </button>
              `;
            })
            .join("")}
        </section>
      `
    )
    .join("");
}

function renderLessonContent(lesson, displayIndex = currentLessonIndex) {
  const paragraphs = (lesson.intro || []).map((text) => `<p>${inlineCode(text)}</p>`).join("");
  const syntax = (lesson.syntax || []).map((text) => `<li>${inlineCode(text)}</li>`).join("");
  const example = lesson.exampleCode
    ? `<h3>示例</h3><div class="example-box"><pre><code>${escapeHtml(lesson.exampleCode)}</code></pre></div>`
    : "";
  const mistakes = (lesson.commonMistakes || []).length
    ? `<h3>常见错误</h3><ul>${lesson.commonMistakes.map((text) => `<li>${inlineCode(text)}</li>`).join("")}</ul>`
    : "";
  const checks = (lesson.checks || []).map((text) => "<li>" + inlineCode(text) + "</li>").join("");
  const taskChecks = checks ? '<details class="task-checks"><summary>本关检查项</summary><ul>' + checks + "</ul></details>" : "";
  const runInstruction = getRunInstruction(lesson);
  const sampleFile = lesson.sampleFile
    ? '<details class="task-checks"><summary>' + escapeHtml(lesson.sampleFile.name) + ' 样例</summary><div class="example-box"><pre><code>' + escapeHtml(lesson.sampleFile.contents) + "</code></pre></div></details>"
    : "";
  const sources = (lesson.sources || []).length
    ? `<div class="source-box"><strong>官方资料：</strong>${lesson.sources
        .map((source) => `<a href="${safeExternalUrl(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a>`)
        .join("")}</div>`
    : "";

  lessonArticle.innerHTML = `
    <h1>${displayIndex + 1}. ${escapeHtml(lesson.title)}</h1>
    <h2>${escapeHtml(lesson.subtitle)}</h2>
    ${paragraphs}
    <h3>语法拆解</h3>
    <ul>${syntax}</ul>
    ${example}
    <div class="task-box">
      <span class="task-label">任务</span>
      <p>${inlineCode(lesson.task || "")}</p>
    </div>
    ${runInstruction ? "<p>" + inlineCode(runInstruction) + "</p>" : ""}
    ${sampleFile}
    ${taskChecks}
    ${mistakes}
    ${sources}
  `;
}

function renderAnswerContent(lesson) {
  answerContent.innerHTML = `
    <p>${inlineCode((lesson.checks || [])[0] || "参考下面的写法完成当前任务。")}</p>
    <pre><code>${escapeHtml(lesson.answerCode || answerCode)}</code></pre>
    ${(lesson.checks || [])
      .slice(1)
      .map((check) => `<p>${inlineCode(check)}</p>`)
      .join("")}
  `;
}

function updateLineNumbers(textarea, lineNode) {
  if (!lineNode) return;
  const lines = Math.max(1, textarea.value.split("\n").length);
  lineNode.textContent = Array.from({ length: lines }, (_, index) => String(index + 1)).join("\n");
}

function syncLineScroll(textarea, lineNode) {
  if (!lineNode) return;
  lineNode.scrollTop = textarea.scrollTop;
}

function syncEditorChrome(textarea, lineNode) {
  updateLineNumbers(textarea, lineNode);
  syncLineScroll(textarea, lineNode);
}

function syncAnswerDrawerBounds() {
  if (!lessonColumn || !practiceColumn) return;

  const lessonRect = lessonColumn.getBoundingClientRect();
  const practiceRect = practiceColumn.getBoundingClientRect();
  const left = Math.max(12, document.querySelector(".study-grid").getBoundingClientRect().left);
  const safeRight = Math.min(lessonRect.right, practiceRect.left - 8);
  const right = Math.max(0, window.innerWidth - safeRight);

  document.documentElement.style.setProperty("--answer-drawer-left", `${left}px`);
  document.documentElement.style.setProperty("--answer-drawer-right", `${right}px`);
}

function saveCurrentDraft() {
  if (!syncProgressReset()) return;
  const lesson = getCurrentLesson();
  const value = codeEditor.value.slice(0, maxDraftLength);
  const draft = value === lesson.starterCode ? null : value;
  const existing = Object.hasOwn(lessonDrafts, lesson.id) ? lessonDrafts[lesson.id] : null;
  if (existing === draft) return;

  if (draft === null) delete lessonDrafts[lesson.id];
  else lessonDrafts[lesson.id] = draft;
  draftChanges.set(lesson.id, draft);
  writeStoredDrafts();
  updateResetButtonState();
}

function hasSavedDrafts() {
  return Object.keys(lessonDrafts).length > 0;
}

function clearDrafts() {
  clearTimeout(writeDraftsTimeout);
  writeDraftsTimeout = null;
  draftChanges.clear();
  lessonDrafts = {};
  try {
    localStorage.removeItem(draftStorageKey);
  } catch {
    // In-memory reset remains available.
  }
  updateResetButtonState();
}

function setNextLessonAction(index) {
  const lessons = getLessonContents();
  const lesson = lessons[index];
  const canOpen = Boolean(lesson) && !isLessonLocked(index);

  nextLessonButton.hidden = !canOpen;
  nextLessonButton.disabled = !canOpen;
  nextLessonButton.dataset.lessonIndex = canOpen ? String(index) : "";
  nextLessonButton.setAttribute("aria-hidden", canOpen ? "false" : "true");

  if (canOpen) {
    nextLessonButton.setAttribute("aria-label", `进入第 ${index + 1} 关：${lesson.title}`);
    nextLessonButton.title = `进入第 ${index + 1} 关`;
  } else {
    nextLessonButton.removeAttribute("aria-label");
    nextLessonButton.title = "";
  }
}

function hideNextLessonAction() {
  setNextLessonAction(-1);
}

function loadLesson(index) {
  if (isLessonLocked(index) || !syncProgressReset()) return;
  if (focusModal.classList.contains("is-open")) closeFocusEditor();
  writeStoredDrafts(true);
  cancelRun(consoleOutput);
  cancelRun(focusOutput);

  currentLessonIndex = index;
  const lesson = getCurrentLesson();
  renderLevels();
  renderLessonContent(lesson, index);
  renderAnswerContent(lesson);
  const draft = lessonDrafts[lesson.id];
  codeEditor.value = draft ?? lesson.starterCode ?? "";
  const mode = getRunInstruction(lesson) ? "本地练习" : "Main.java";
  editorModeLabel.textContent = mode;
  focusModeLabel.textContent = mode;
  stdinInput.value = "";
  syncEditorChrome(codeEditor, editorLines);
  consoleOutput.textContent = `Loaded: ${index + 1}. ${lesson.title}`;
  runMeta.textContent = draft !== undefined ? "草稿已恢复" : "等待运行";
  runMeta.className = "run-meta";
  setAnswerDrawer(false);
  hideNextLessonAction();
  syncAnswerDrawerBounds();
}

function setProgress(nextCompletedLessons) {
  const completedCount = normalizeCompletedCount(nextCompletedLessons);
  const percent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  progressText.textContent = `${completedCount}/${totalLessons} 关`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  updateResetButtonState(completedCount);
}

function updateResetButtonState(nextCompletedLessons = completedLessons) {
  const canReset = normalizeCompletedCount(nextCompletedLessons) > 0 || hasSavedDrafts();
  resetProgress.disabled = !canReset;
  resetProgress.setAttribute("aria-disabled", canReset ? "false" : "true");
}

function saveProgress(nextCompleted) {
  completedLessons = normalizeCompletedCount(nextCompleted);
  const completedLessonIds = getLessonContents()
    .slice(0, completedLessons)
    .map((lesson) => lesson?.id)
    .filter(Boolean);

  try {
    localStorage.setItem(progressStorageKey, JSON.stringify({
      completedLessons,
      completedLessonIds,
      resetId: progressResetId,
      updatedAt: new Date().toISOString()
    }));
    localStorage.removeItem(legacyProgressStorageKey);
  } catch {
    // Progress still works in the current tab without persistent storage.
  }
  setProgress(completedLessons);
}

function syncProgressReset() {
  const resetId = readResetId();
  if (resetId === null || resetId === progressResetId) return true;
  progressResetId = resetId;
  clearTimeout(writeDraftsTimeout);
  draftChanges.clear();
  lessonDrafts = readStoredDrafts();
  completedLessons = readStoredProgress();
  setProgress(completedLessons);
  loadLesson(0);
  return false;
}

function syncStoredChanges(event) {
  if (![null, resetStorageKey, progressStorageKey, draftStorageKey].includes(event.key) ||
      !syncProgressReset()) return;
  if (event.key === progressStorageKey || event.key === null) {
    completedLessons = readStoredProgress();
    if (isLessonLocked(currentLessonIndex)) loadLesson(0);
    setProgress(completedLessons);
    renderLevels();
  }
  if (event.key === draftStorageKey || event.key === null) {
    const oldDraft = lessonDrafts[getCurrentLesson().id];
    lessonDrafts = readStoredDrafts();
    const lesson = getCurrentLesson();
    for (const [id, draft] of draftChanges) {
      if (draft === null) delete lessonDrafts[id];
      else lessonDrafts[id] = draft;
    }
    if (!draftChanges.has(lesson.id) && oldDraft !== lessonDrafts[lesson.id]) {
      codeEditor.value = lessonDrafts[lesson.id] ?? lesson.starterCode ?? "";
      focusEditor.value = codeEditor.value;
      syncEditorChrome(codeEditor, editorLines);
      syncEditorChrome(focusEditor, focusLines);
    }
    updateResetButtonState();
  }
}

function setAnswerDrawer(open) {
  if (open) syncAnswerDrawerBounds();
  answerDrawer.classList.toggle("is-open", open);
  answerDrawer.inert = !open;
  answerDrawer.setAttribute("aria-hidden", open ? "false" : "true");
  showAnswer.classList.toggle("is-active", open);
  showAnswer.setAttribute("aria-pressed", open ? "true" : "false");
  showAnswer.innerHTML = open
    ? '<span class="button-glyph">×</span> 隐藏答案'
    : '<span class="button-glyph">?</span> 查看答案';
}

function setTheme(theme) {
  theme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(themeStorageKey, theme);
    localStorage.removeItem(legacyThemeStorageKey);
  } catch {
    // The current tab still supports both themes.
  }
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  themeToggle.innerHTML = `<span class="button-glyph">${theme === "dark" ? "☀" : "☾"}</span>`;
}

function replaceSelection(textarea, value) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.value = `${textarea.value.slice(0, start)}${value}${textarea.value.slice(end)}`;
  textarea.selectionStart = start + value.length;
  textarea.selectionEnd = start + value.length;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function autoIndentLine(textarea) {
  const start = textarea.selectionStart;
  const value = textarea.value;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const currentLine = value.slice(lineStart, start);
  const baseIndent = currentLine.match(/^\s*/)?.[0] || "";
  const extraIndent = currentLine.trimEnd().endsWith("{") ? "    " : "";
  replaceSelection(textarea, `\n${baseIndent}${extraIndent}`);
}

function bindEditorShortcuts(textarea, runAction) {
  textarea.addEventListener("keydown", (event) => {
    if (event.isComposing || event.keyCode === 229) return;

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runAction();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      autoIndentLine(textarea);
    }
  });
}

function bindEditorChrome(textarea, lineNode) {
  syncEditorChrome(textarea, lineNode);
  textarea.addEventListener("input", () => syncEditorChrome(textarea, lineNode));
  textarea.addEventListener("scroll", () => syncLineScroll(textarea, lineNode));
}

function getRunInstruction(lesson) {
  if (lesson.runInstruction) return lesson.runInstruction;
  if (!/\bpublic\s+class\s+Main\b/.test(lesson.answerCode || "")) {
    return "请在本地项目或终端使用本关对应工具运行。这里可以提交片段并检查是否满足任务要求。";
  }
  return "";
}

function cancelRun(outputNode) {
  const pending = pendingRuns.get(outputNode);
  if (pending) {
    pending.abort();
    pendingRuns.delete(outputNode);
  }
}

function renderRunResult(result, outputNode, metaNode) {
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");

  outputNode.textContent = output || "程序运行完成，但没有输出。";
  metaNode.textContent = `${result.status} · ${result.durationMs || 0}ms`;
  metaNode.className =
    result.status === "success"
      ? `${metaNode === runMeta ? "run-meta " : ""}status-success`
      : result.status === "learning-preview" ||
          result.status === "preview-limited" ||
          result.status === "local-exercise"
        ? `${metaNode === runMeta ? "run-meta " : ""}status-warn`
        : `${metaNode === runMeta ? "run-meta " : ""}status-error`;
}

async function runCode(sourceEditor = codeEditor, outputNode = consoleOutput, metaNode = runMeta, inputNode = stdinInput) {
  if (!syncProgressReset()) return;
  cancelRun(outputNode);
  const runInstruction = getRunInstruction(getCurrentLesson());
  if (runInstruction) {
    renderRunResult({ status: "local-exercise", stderr: runInstruction }, outputNode, metaNode);
    return;
  }

  const code = sourceEditor.value;
  const stdin = inputNode.value;
  outputNode.textContent = "正在运行 Java 代码...";
  metaNode.textContent = "运行中";
  metaNode.className = metaNode === runMeta ? "run-meta" : "";

  if (!["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    renderRunResult(runTeachingPreview(code), outputNode, metaNode);
    return;
  }

  const controller = new AbortController();
  pendingRuns.set(outputNode, controller);
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let result;
  try {
    const response = await fetch("api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, stdin }),
      signal: controller.signal
    });
    result = await response.json();
    if (!result || typeof result.status !== "string") throw new Error("未收到有效的运行结果。");
  } catch {
    if (pendingRuns.get(outputNode) !== controller) return;
    if (controller.signal.aborted) {
      result = { status: "timeout", stderr: "本地运行请求超时，请稍后重试。" };
    } else {
      try {
        result = runTeachingPreview(code);
      } catch {
        result = { status: "run-error", stderr: "无法连接本地 JDK，教学预览也未能完成。" };
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  if (pendingRuns.get(outputNode) === controller) {
    pendingRuns.delete(outputNode);
    if (sourceEditor.value !== code) {
      outputNode.textContent = "代码已修改，请重新运行。";
      metaNode.textContent = "等待运行";
      metaNode.className = metaNode === runMeta ? "run-meta" : "";
      return;
    }
    renderRunResult(result, outputNode, metaNode);
  }
}

function submitTask() {
  if (!syncProgressReset()) return;
  cancelRun(consoleOutput);
  writeStoredDrafts(true);
  const lesson = getCurrentLesson();
  const validation = gradeJavaLesson(lesson, codeEditor.value);

  if (validation.ok) {
    const previousCompleted = Math.max(completedLessons, readStoredProgress());
    const nextCompleted = Math.max(previousCompleted, currentLessonIndex + 1);
    const nextLesson = getLessonContents()[nextCompleted];
    const didUnlock = nextCompleted > previousCompleted;

    saveProgress(nextCompleted);
    renderLevels();

    const lines = [`Task passed: ${currentLessonIndex + 1}. ${lesson.title}`, `Progress: ${completedLessons}/${totalLessons}`];
    if (didUnlock && nextLesson) {
      lines.push(`Unlocked: ${nextCompleted + 1}. ${nextLesson.title}`);
    } else if (completedLessons >= totalLessons) {
      lines.push("All lessons completed.");
    }

    consoleOutput.textContent = lines.join("\n");
    runMeta.textContent = "task-passed";
    runMeta.className = "run-meta status-success";
    setNextLessonAction(currentLessonIndex + 1);
    return;
  }

  consoleOutput.textContent = validation.message;
  runMeta.textContent = "task-needs-work";
  runMeta.className = "run-meta status-warn";
  hideNextLessonAction();
}

function openFocusEditor() {
  writeStoredDrafts(true);
  focusEditor.value = codeEditor.value;
  focusStdinInput.value = stdinInput.value;
  syncEditorChrome(focusEditor, focusLines);
  focusOutput.textContent = consoleOutput.textContent;
  focusRunMeta.textContent = runMeta.textContent;
  focusRunMeta.className = runMeta.className.replace("run-meta", "").trim();
  focusHasRun = false;
  setAnswerDrawer(false);
  trainingApp.inert = true;
  focusModal.classList.add("is-open");
  focusModal.setAttribute("aria-hidden", "false");
  focusEditor.focus();
}

function closeFocusEditor() {
  const wasRunning = pendingRuns.has(focusOutput);
  cancelRun(focusOutput);
  stdinInput.value = focusStdinInput.value;
  writeStoredDrafts(true);
  if (focusHasRun && !wasRunning) {
    cancelRun(consoleOutput);
    consoleOutput.textContent = focusOutput.textContent;
    runMeta.textContent = focusRunMeta.textContent;
    runMeta.className = ("run-meta " + focusRunMeta.className).trim();
  }
  focusModal.classList.remove("is-open");
  focusModal.setAttribute("aria-hidden", "true");
  trainingApp.inert = false;
  openFocusButton.focus();
}

function runFocusCode() {
  focusHasRun = true;
  writeStoredDrafts(true);
  runCode(focusEditor, focusOutput, focusRunMeta, focusStdinInput);
}

function bindEvents() {
  levelList.addEventListener("click", (event) => {
    const item = event.target.closest(".level-item");
    if (!item) return;
    const lessonIndex = Number(item.dataset.lessonIndex || 0);
    if (item.disabled || isLessonLocked(lessonIndex)) return;
    loadLesson(lessonIndex);
  });
  document.querySelector("#runCode").addEventListener("click", () => runCode());
  codeEditor.addEventListener("input", saveCurrentDraft);
  focusEditor.addEventListener("input", () => {
    codeEditor.value = focusEditor.value;
    syncEditorChrome(codeEditor, editorLines);
    saveCurrentDraft();
  });
  openFocusButton.addEventListener("click", openFocusEditor);
  closeFocusButton.addEventListener("click", closeFocusEditor);
  focusRunButton.addEventListener("click", runFocusCode);
  bindEditorShortcuts(codeEditor, () => runCode());
  bindEditorShortcuts(focusEditor, runFocusCode);
  bindEditorChrome(codeEditor, editorLines);
  bindEditorChrome(focusEditor, focusLines);
  focusModal.addEventListener("click", (event) => {
    if (event.target === focusModal) closeFocusEditor();
  });
  focusModal.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeFocusEditor();
    }
    if (event.key === "Tab" && event.shiftKey && event.target === focusRunButton) {
      event.preventDefault();
      focusStdinInput.focus();
    }
    if (event.key === "Tab" && !event.shiftKey && event.target === focusStdinInput) {
      event.preventDefault();
      focusRunButton.focus();
    }
  });
  showAnswer.addEventListener("click", () => {
    const open = !answerDrawer.classList.contains("is-open");
    setAnswerDrawer(open);
    if (open) closeAnswer.focus();
  });
  closeAnswer.addEventListener("click", () => {
    setAnswerDrawer(false);
    showAnswer.focus();
  });
  answerDrawer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAnswer.click();
  });
  document.querySelector("#clearConsole").addEventListener("click", () => {
    cancelRun(consoleOutput);
    consoleOutput.textContent = "";
    runMeta.textContent = "已清空";
    runMeta.className = "run-meta";
  });
  document.querySelector("#clearStdin").addEventListener("click", () => {
    stdinInput.value = "";
  });
  document.querySelector("#submitTask").addEventListener("click", submitTask);
  nextLessonButton.addEventListener("click", () => {
    const lessonIndex = Number(nextLessonButton.dataset.lessonIndex || -1);
    if (Number.isInteger(lessonIndex) && lessonIndex >= 0 && !isLessonLocked(lessonIndex)) {
      loadLesson(lessonIndex);
    }
  });
  resetProgress.addEventListener("click", () => {
    if ((completedLessons > 0 || hasSavedDrafts()) && !window.confirm("确认重置学习进度？")) return;

    progressResetId = crypto.randomUUID?.() ?? String(Date.now());
    try {
      localStorage.setItem(resetStorageKey, progressResetId);
    } catch {
      // The current tab can still reset its progress.
    }
    clearDrafts();
    saveProgress(0);
    loadLesson(0);
    consoleOutput.textContent = `Progress reset.\nLoaded: 1. ${getCurrentLesson().title}`;
    runMeta.textContent = "已重置";
    runMeta.className = "run-meta";
  });
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(currentTheme === "dark" ? "light" : "dark");
    syncAnswerDrawerBounds();
  });
  window.addEventListener("resize", syncAnswerDrawerBounds);
  window.addEventListener("storage", syncStoredChanges);
  window.addEventListener("pagehide", () => writeStoredDrafts(true));
}

function boot() {
  completedLessons = readStoredProgress();
  setProgress(completedLessons);
  setTheme(readStoredTheme());
  loadLesson(0);
  bindEvents();
  syncAnswerDrawerBounds();
}

document.addEventListener("DOMContentLoaded", boot);
