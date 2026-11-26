import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { gradeJavaLesson } from "../public/submission-grading.js";
import { runTeachingPreview } from "../public/teaching-preview.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const outlineSource = fs.readFileSync(path.join(publicDir, "course-outline.js"), "utf8");
const groupsStart = outlineSource.indexOf("window.COURSE_GROUPS = ");
const groupsEnd = outlineSource.lastIndexOf(";");

if (groupsStart === -1 || groupsEnd === -1) {
  throw new Error("Could not read COURSE_GROUPS from course-outline.js.");
}

const expectedGroups = vm.runInNewContext(
  outlineSource.slice(groupsStart + "window.COURSE_GROUPS = ".length, groupsEnd).trim()
);
const expectedLessonsByLevel = expectedGroups.map((group) => group.lessons.map((lesson) => lesson.title));
const requiredFields = [
  "id",
  "title",
  "subtitle",
  "intro",
  "syntax",
  "exampleCode",
  "task",
  "starterCode",
  "answerCode",
  "checks",
  "commonMistakes",
  "sources"
];
const officialSourceHosts = [
  "code.visualstudio.com",
  "commons.apache.org",
  "curl.se",
  "dev.java",
  "dev.mysql.com",
  "docs.docker.com",
  "docs.github.com",
  "docs.gradle.org",
  "docs.junit.org",
  "docs.oracle.com",
  "docs.spring.io",
  "git-scm.com",
  "github.com",
  "google.github.io",
  "httpie.io",
  "jakarta.ee",
  "junit.org",
  "learning.postman.com",
  "man7.org",
  "maven.apache.org",
  "openjdk.org",
  "oracle.com",
  "postgresql.org",
  "spec.openapis.org",
  "spring.io",
  "springdoc.org",
  "swagger.io"
];

function normalizeTitle(title) {
  return title.replace(/\s*[（(].*?[）)]/g, "").trim();
}

const files = fs
  .readdirSync(publicDir)
  .filter((file) => /^lesson-content-level\d+\.js$/.test(file))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (files.length === 0) {
  throw new Error("No lesson content files found.");
}

const context = { window: {} };
vm.createContext(context);

for (const file of files) {
  const fullPath = path.join(publicDir, file);
  vm.runInContext(fs.readFileSync(fullPath, "utf8"), context, { filename: file });
}

let total = 0;
const seenIds = new Set();
for (const file of files) {
  const level = Number(file.match(/\d+/)[0]);
  const key = `LESSON_CONTENT_LEVEL${level}`;
  const lessons = context.window[key];
  const expectedTitles = expectedLessonsByLevel[level - 1] || [];

  if (!Array.isArray(lessons)) {
    throw new Error(`${key} is not an array.`);
  }

  if (lessons.length !== expectedTitles.length) {
    throw new Error(`${key} has ${lessons.length} lessons, expected ${expectedTitles.length}.`);
  }

  lessons.forEach((lesson, index) => {
    const missing = requiredFields.filter((field) => !(field in lesson));
    if (missing.length > 0) {
      throw new Error(`${key}[${index}] missing fields: ${missing.join(", ")}`);
    }

    const normalizedLessonTitle = normalizeTitle(lesson.title);
    const normalizedExpectedTitle = normalizeTitle(expectedTitles[index]);
    const titleMatches =
      normalizedLessonTitle === normalizedExpectedTitle ||
      expectedTitles[index].includes(lesson.title) ||
      lesson.title.includes(expectedTitles[index]);

    if (!titleMatches) {
      throw new Error(`${key}[${index}] title "${lesson.title}" does not match "${expectedTitles[index]}".`);
    }

    if (seenIds.has(lesson.id)) {
      throw new Error(`Duplicate lesson id: ${lesson.id}`);
    }
    seenIds.add(lesson.id);

    for (const field of ["intro", "syntax", "checks", "commonMistakes", "sources"]) {
      if (!Array.isArray(lesson[field])) {
        throw new Error(`${key}[${index}].${field} must be an array.`);
      }

      if (lesson[field].length === 0) {
        throw new Error(`${key}[${index}].${field} must not be empty.`);
      }
    }

    if (lesson.intro.join("").length < 120) {
      throw new Error(`${key}[${index}].intro is too short.`);
    }

    if (lesson.syntax.length < 5 || lesson.checks.length < 4 || lesson.commonMistakes.length < 4) {
      throw new Error(`${key}[${index}] needs richer syntax/checks/commonMistakes.`);
    }

    if (!String(lesson.exampleCode || "").trim() || !String(lesson.answerCode || "").trim()) {
      throw new Error(`${key}[${index}] needs exampleCode and answerCode.`);
    }

    if (!gradeJavaLesson(lesson, lesson.answerCode).ok) {
      throw new Error(`${lesson.id} reference answer did not satisfy the grading rules.`);
    }
    if (gradeJavaLesson(lesson, lesson.starterCode).ok || gradeJavaLesson(lesson, "").ok) {
      throw new Error(`${lesson.id} accepts unfinished work.`);
    }

    lesson.sources.forEach((source, sourceIndex) => {
      if (!source.title || !source.url) {
        throw new Error(`${key}[${index}].sources[${sourceIndex}] needs title and url.`);
      }

      const url = new URL(source.url);
      const host = url.hostname.replace(/^www\./, "");
      const isOfficial = officialSourceHosts.some((domain) => host === domain || host.endsWith(`.${domain}`));

      if (url.protocol !== "https:") {
        throw new Error(`${key}[${index}].sources[${sourceIndex}] must use https.`);
      }
      if (!isOfficial) {
        throw new Error(`${key}[${index}].sources[${sourceIndex}] is not on the official source host allowlist: ${host}`);
      }
    });
  });

  total += lessons.length;
  console.log(`${key}: ${lessons.length} lessons`);
}

const expectedTotal = expectedLessonsByLevel.flat().length;
if (total !== expectedTotal) {
  throw new Error(`Total authored lessons ${total}, expected ${expectedTotal}.`);
}

console.log(`Total authored lessons: ${total}`);

const main = (body) => "class Main { public static void main(String[] args) { " + body + " } }";
const forLoopLesson = context.window.LESSON_CONTENT_LEVEL2.find(({ id }) => id === "level2-for-loop");
const forLoopAnswer = forLoopLesson.answerCode;
const forLoopChecks = [
  ["explicit addition", forLoopAnswer.replace("number += 2", "number = number + 2"), true],
  ["commuted addition", forLoopAnswer.replace("number += 2", "number = 2 + number"), true],
  ["commuted addition with wrong step", forLoopAnswer.replace("number += 2", "number = 3 + number"), false],
  ["exclusive upper bound omits 10", forLoopAnswer.replace("number <= 10", "number < 10"), false],
  ["equivalent exclusive bound", forLoopAnswer.replace("number <= 10", "number < 11"), true],
  ["reversed inclusive bound", forLoopAnswer.replace("number <= 10", "10 >= number"), true],
  ["reversed equivalent exclusive bound", forLoopAnswer.replace("number <= 10", "11 > number"), true],
  ["reversed exclusive bound omits 10", forLoopAnswer.replace("number <= 10", "10 > number"), false],
  ["reversed inclusive bound prints 12", forLoopAnswer.replace("number <= 10", "12 >= number"), false],
  ["odd starting value", forLoopAnswer.replace("number = 2", "number = 1"), false],
  ["incorrect printed value", forLoopAnswer.replace("println(number)", "println(number + 1)"), false],
  ["print outside the loop", main("for (int i = 2; i <= 10; i += 2) {} System.out.println(10);"), false],
  ["extra print after the expected sequence", main("for (int i = 2; 10 >= i; i = 2 + i) System.out.println(i); System.out.println(10);"), false],
  ["reversed bound with commuted addition", main("for (int i = 2; 10 >= i; i = 2 + i) System.out.println(i);"), true],
  ["counter redeclares main array parameter", forLoopAnswer.replace("String[] args", "String[] number"), false],
  ["counter redeclares main varargs parameter", forLoopAnswer.replace("String[] args", "String... number"), false],
  ["counter redeclares main parameter with trailing brackets", forLoopAnswer.replace("String[] args", "String number[]"), false],
  ["main varargs with a distinct counter", forLoopAnswer.replace("String[] args", "String... values"), true],
  ["main parameter with trailing brackets and a distinct counter", forLoopAnswer.replace("String[] args", "String values[]"), true],
  ["filtering even numbers", main("for (int i = 1; i <= 10; i++) { if (i % 2 == 0) { System.out.println(i); } }"), true],
  ["doubling the counter", main("for (int i = 1; i <= 5; ++i) System.out.println(i * 2);"), true]
];
const failedForLoopChecks = forLoopChecks.filter(([, source, expected]) => gradeJavaLesson(forLoopLesson, source).ok !== expected);
if (failedForLoopChecks.length) {
  throw new Error("Unexpected for-loop grades: " + failedForLoopChecks.map(([name]) => name).join(", "));
}

const previewChecks = [
  [main('System.out.println(3 + 4);'), "7\n"],
  [main('String name = "Ada"; System.out.println(name + ": " + 3 + 4);'), "Ada: 34\n"],
  [main('int n = 2; System.out.println(n); n = 3;'), ""],
  [main('if (true) System.out.println("hello"); else System.out.println("bye");'), ""],
  [main('System.out.println("ok"); System.out.println(missing);'), ""]
];
for (const [source, expectedOutput] of previewChecks) {
  const result = runTeachingPreview(source);
  if (result.stdout !== expectedOutput || result.status !== (expectedOutput ? "learning-preview" : "preview-limited")) {
    throw new Error("Unexpected teaching preview result for " + source);
  }
}

const fullString = "a".repeat(6000);
const previewLimitChecks = [
  ["exact string and output limit", main(`String half = "${fullString}"; System.out.print(half + half);`), "learning-preview", fullString + fullString],
  ["oversized concatenation before printing", main(`String half = "${fullString}"; String large = half + half + 1; System.out.println("small");`), "preview-limited", ""],
  ["oversized literal before printing", main(`String large = "${fullString + fullString}a"; System.out.println("small");`), "preview-limited", ""],
  ["newline exceeds output limit", main(`String half = "${fullString}"; System.out.println(half + half);`), "preview-limited", ""],
  ["large source with small output", main(' '.repeat(20000) + 'System.out.println("small");'), "preview-limited", ""]
];
const failedPreviewLimits = previewLimitChecks.filter(([, source, status, stdout]) => {
  const result = runTeachingPreview(source);
  return result.status !== status || result.stdout !== stdout;
});
if (failedPreviewLimits.length) {
  throw new Error("Unexpected preview limits: " + failedPreviewLimits.map(([name]) => name).join(", "));
}

console.log("Reference answers, starter templates, for-loop grading, and preview checks passed.");
