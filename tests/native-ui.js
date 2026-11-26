import assert from "node:assert/strict";
import { suite, check } from "./safari.js";

const passingHelloWorld =
  'public class Main {\n' +
  '    public static void main(String[] args) {\n' +
  '        System.out.println("Hello, Java!");\n' +
  "    }\n" +
  "}";

const scannerEcho =
  "import java.util.Scanner;\n" +
  "public class Main {\n" +
  "    public static void main(String[] args) {\n" +
  "        Scanner scanner = new Scanner(System.in);\n" +
  "        String name = scanner.nextLine();\n" +
  "        int age = scanner.nextInt();\n" +
  '        System.out.println(name + ":" + age);\n' +
  "    }\n" +
  "}";

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
}

suite(test => {
  test("locks lessons, unlocks the next lesson, and protects reset", async ({ page }) => {
    await check(() => page.title(), "java-path");
    await check(() => page.locator(".brand strong").text(), "java-path");
    await check(() => page.locator(".level-item").count(), 104);
    await check(() => page.locator(".level-item:disabled").count(), 103);
    await check(() => page.locator("#resetProgress").enabled(), false);

    await check(() => page.locator(".level-item").nth(2).attribute("title"), "完成前一关后解锁");
    await check(() => page.locator(".level-item").nth(2).attribute("aria-label"), /完成前一关后解锁/);

    await page.locator("#submitTask").click();
    await check(() => page.locator("#runMeta").text(), "task-needs-work");
    await check(() => page.locator("#progressText").text(), "0/104 关");

    await page.locator("#codeEditor").fill(passingHelloWorld);
    await page.locator("#submitTask").click();

    await check(() => page.locator("#consoleOutput").text(), "Task passed: 1.", "contains");
    await check(() => page.locator("#consoleOutput").text(), "Unlocked: 2.", "contains");
    await check(() => page.locator("#progressText").text(), "1/104 关");
    await check(() => page.locator(".level-item:disabled").count(), 102);
    await check(() => page.locator(".level-item").nth(1).enabled(), true);
    await check(() => page.locator("#resetProgress").enabled(), true);
    await check(() => page.locator("#nextLesson").visible(), true);
    await check(() => page.locator("#nextLesson").enabled(), true);

    page.confirm( async (dialog) => {
      assert.deepEqual(await dialog.getText(), "确认重置学习进度？");
      await dialog.dismiss();
    });
    await page.locator("#resetProgress").click();
    await check(() => page.locator("#progressText").text(), "1/104 关");

    page.confirm( async (dialog) => {
      assert.deepEqual(await dialog.getText(), "确认重置学习进度？");
      await dialog.accept();
    });
    await page.locator("#resetProgress").click();
    await check(() => page.locator("#progressText").text(), "0/104 关");
    await check(() => page.locator(".level-item:disabled").count(), 103);
    await check(() => page.locator("#resetProgress").enabled(), false);
  });

  test("saves lesson drafts and opens the next unlocked lesson", async ({ page }) => {
    const secondLessonDraft =
      'public class Main {\n' +
      '    public static void main(String[] args) {\n' +
      '        System.out.println("Lesson two draft");\n' +
      "    }\n" +
      "}";

    await page.locator("#codeEditor").fill(passingHelloWorld);
    await page.locator("#submitTask").click();
    await check(() => page.locator("#nextLesson").visible(), true);

    await page.locator("#nextLesson").click();
    await check(() => page.locator("#consoleOutput").text(), "Loaded: 2.", "contains");
    await check(() => page.locator("#nextLesson").visible(), false);
    await check(() => page.locator("#codeEditor").value(), /输出源码文件名/);

    await page.locator("#codeEditor").fill(secondLessonDraft);
    await page.locator(".level-item").nth(0).click();
    await check(() => page.locator("#codeEditor").value(), passingHelloWorld);

    await page.locator(".level-item").nth(1).click();
    await check(() => page.locator("#codeEditor").value(), secondLessonDraft);

    const draftIds = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("java-path-drafts-v1")).drafts));
    assert.deepEqual(draftIds, ["level1-1-hello-java", "level1-2-how-java-runs"]);

    page.confirm( async (dialog) => {
      await dialog.accept();
    });
    await page.locator("#resetProgress").click();
    await check(() => page.locator("#codeEditor").value(), /public class Main/);
    await check(() => page.locator("#progressText").text(), "0/104 关");
    await check(() => page.locator("#nextLesson").visible(), false);
    const draftsAfterReset = await page.evaluate(() => localStorage.getItem("java-path-drafts-v1"));
    assert.equal(draftsAfterReset, null);
  });

  test("enables reset when only a draft exists", async ({ page }) => {
    await check(() => page.locator("#progressText").text(), "0/104 关");
    await check(() => page.locator("#resetProgress").enabled(), false);

    await page.locator("#codeEditor").fill(passingHelloWorld);
    await check(() => page.locator("#resetProgress").enabled(), true);

    page.confirm( async (dialog) => {
      assert.deepEqual(await dialog.getText(), "确认重置学习进度？");
      await dialog.accept();
    });
    await page.locator("#resetProgress").click();

    await check(() => page.locator("#codeEditor").value(), /public class Main/);
    await check(() => page.locator("#progressText").text(), "0/104 关");
    await check(() => page.locator("#resetProgress").enabled(), false);
    const draftsAfterReset = await page.evaluate(() => localStorage.getItem("java-path-drafts-v1"));
    assert.equal(draftsAfterReset, null);
  });

  test("sends standard input to the runner without storing it", async ({ page }) => {
    const runRequests = [];
    page.mockRun(payload => {
      runRequests.push(payload);
      return {
          status: "success",
          stdout: `stdin:${payload.stdin}`,
          stderr: "",
          durationMs: 7
        };
    });

    await page.evaluate(() => {
      window.stdinEdits = [];
      for (const id of ["stdinInput", "focusStdinInput"]) {
        document.getElementById(id).addEventListener("input", (event) => {
          if (event.isTrusted) window.stdinEdits.push(id);
        });
      }
    });
    await page.locator("#codeEditor").fill(scannerEcho);
    await page.locator("#stdinInput").type("Alice\n18");
    await page.locator("#runCode").click();

    await check(() => page.locator("#consoleOutput").text(), "stdin:Alice\n18", "contains");
    assert.deepEqual(runRequests.at(-1), { code: scannerEcho, stdin: "Alice\n18" });
    await check(() => page.locator("#resetProgress").enabled(), true);
    const storedInputBeforeReload = await page.evaluate(() => localStorage.getItem("java-path-stdin-v1"));
    assert.equal(storedInputBeforeReload, null);

    await page.locator("#focusCode").click();
    await check(() => page.locator("#focusStdinInput").value(), "Alice\n18");

    await page.locator("#focusStdinInput").type("Bob\n19");
    await page.locator("#focusRun").click();
    await check(() => page.locator("#focusOutput").text(), "stdin:Bob\n19", "contains");
    assert.deepEqual(runRequests.at(-1), { code: scannerEcho, stdin: "Bob\n19" });

    await page.locator("#closeFocus").click();
    await check(() => page.locator("#stdinInput").value(), "Bob\n19");
    assert.deepEqual(await page.evaluate(() => [...new Set(window.stdinEdits)]), ["stdinInput", "focusStdinInput"]);

    await page.reload();
    await check(() => page.locator("#stdinInput").value(), "");
    const storedInputAfterReload = await page.evaluate(() => localStorage.getItem("java-path-stdin-v1"));
    assert.equal(storedInputAfterReload, null);
  });

  test("standard input alone does not enable reset", async ({ page }) => {
    await check(() => page.locator("#resetProgress").enabled(), false);
    await page.locator("#stdinInput").type("Only runtime input");
    await check(() => page.locator("#resetProgress").enabled(), false);

    await page.locator("#clearStdin").click();
    await check(() => page.locator("#stdinInput").value(), "");
    await check(() => page.locator("#resetProgress").enabled(), false);
  });

  test("restores progress by completed lesson ids, not by stale counts", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "java-path-progress-v1",
        JSON.stringify({
          completedLessons: 8,
          completedLessonIds: ["level1-1-hello-java"],
          updatedAt: new Date().toISOString()
        })
      );
    });
    await page.reload();

    await check(() => page.locator("#progressText").text(), "1/104 关");
    await check(() => page.locator(".level-item:disabled").count(), 102);
    await check(() => page.locator(".level-item").nth(1).enabled(), true);
    await check(() => page.locator(".level-item").nth(2).enabled(), false);
  });

  test("normalizes corrupt stored progress before rendering", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "java-path-progress-v1",
        JSON.stringify({
          completedLessons: 2.8,
          updatedAt: new Date().toISOString()
        })
      );
    });
    await page.reload();

    await check(() => page.locator("#progressText").text(), "2/104 关");
    await check(() => page.locator(".level-item:disabled").count(), 101);
    await check(() => page.locator(".level-item").nth(2).enabled(), true);
    await check(() => page.locator(".level-item").nth(3).enabled(), false);
  });

  test("core UI panels open without layout overflow", async ({ page }) => {
    await check(() => hasHorizontalOverflow(page), false);

    await page.locator("#showAnswer").click();
    await check(() => page.locator("#answerDrawer").attribute("class"), /is-open/);
    await check(() => hasHorizontalOverflow(page), false);
    await page.locator("#closeAnswer").click();
    await check(() => page.locator("#answerDrawer").attribute("class"), /is-open/, "notMatch");

    await page.locator("#focusCode").click();
    await check(() => page.locator("#focusModal").attribute("class"), /is-open/);
    await check(() => hasHorizontalOverflow(page), false);

    await page.locator("#closeFocus").click();
    await check(() => page.locator("#focusModal").attribute("class"), /is-open/, "notMatch");

    await page.locator("#codeEditor").fill(passingHelloWorld);
    await page.locator("#runCode").click();
    await check(() => page.locator("#consoleOutput").text(), "Hello, Java!", "contains");
    await check(() => page.locator("#runMeta").text(), /^success\b/);
  });

  test("leaves the busy state when the fallback preview throws", async ({ page }) => {
    page.mockRun(() => { throw new Error("Runner unavailable"); });
    await page.locator("#codeEditor").fill(passingHelloWorld);
    await page.evaluate((source) => {
      const replace = String.prototype.replace;
      String.prototype.replace = function (...args) {
        if (String(this) === source) {
          String.prototype.replace = replace;
          throw new RangeError("Preview failed");
        }
        return replace.apply(this, args);
      };
    }, passingHelloWorld);

    await page.locator("#runCode").click();
    await check(() => page.locator("#runMeta").text(), /^preview-limited\b/);
    await check(() => page.locator("#runMeta").attribute("class"), /status-warn/);
    await page.locator("#runCode").click();
    await check(() => page.locator("#runMeta").text(), /^learning-preview\b/);
    await check(() => page.locator("#consoleOutput").text(), "Hello, Java!", "contains");
  });

  test("another tab can reset progress before a stale draft or submission is saved", async ({ page }) => {
    await page.locator("#codeEditor").fill(passingHelloWorld);
    await page.locator("#submitTask").click();
    await check(() => page.locator("#progressText").text(), "1/104 关");
    await page.evaluate(() => {
      const frame = document.createElement("iframe");
      frame.id = "resetTab";
      frame.hidden = true;
      frame.src = "./";
      document.body.append(frame);
    });
    await check(() => page.evaluate(() =>
      document.querySelector("#resetTab").contentDocument.querySelector("#resetProgress")?.disabled === false
    ), true);

    await page.evaluate(draft => {
      const editor = document.querySelector("#codeEditor");
      editor.value = draft + "\n// pending draft";
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      const other = document.querySelector("#resetTab").contentWindow;
      other.confirm = () => true;
      other.document.querySelector("#resetProgress").click();
      document.querySelector("#submitTask").click();
    }, passingHelloWorld);
    await check(() => page.locator("#progressText").text(), "0/104 关");
    await page.reload();
    await check(() => page.locator("#progressText").text(), "0/104 关");
    assert.equal(await page.evaluate(() => localStorage.getItem("java-path-drafts-v1")), null);
  });

  test("ignores a run response after switching lessons", async ({ page }) => {
    await page.locator("#codeEditor").fill(passingHelloWorld);
    await page.locator("#submitTask").click();
    let release;
    const oldRun = new Promise((resolve) => { release = resolve; });
    page.mockRun(() => oldRun);
    await page.locator("#runCode").click();
    await check(() => page.locator("#runMeta").text(), "运行中");
    await page.locator(".level-item").nth(1).click();
    release({ status: "success", stdout: "stale result", durationMs: 20 });
    await check(() => page.locator("#consoleOutput").text(), "Loaded: 2.", "contains");
  });

  test("lets keyboard focus leave the editor and restores focus on Escape", async ({ page }) => {
    await page.evaluate(() => document.querySelector("#codeEditor").focus());
    await page.press("TAB");
    await check(() => page.evaluate(() => document.activeElement.id === "codeEditor"), false);
    await page.locator("#focusCode").click();
    await check(() => page.evaluate(() => document.activeElement.id), "focusEditor");
    await page.press("ESCAPE");
    await check(() => page.evaluate(() => document.activeElement.id), "focusCode");
  });
});
