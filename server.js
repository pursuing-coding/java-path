import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { runTeachingPreview } from "./public/teaching-preview.js";

const port = Number(process.env.PORT || 4173);
const publicDir = fileURLToPath(new URL("./public", import.meta.url));
const maxCodeLength = 20_000;
const maxOutputLength = 12_000;
const runTimeoutMs = 5_000;

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".png", "image/png"],
  [".ico", "image/x-icon"]
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(text);
}

function readBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      if (size > 64_000) return;
      size += chunk.length;
      if (size > 64_000) {
        const error = new Error("请求体超过 64000 字节。");
        error.statusCode = 413;
        rejectBody(error);
        return;
      }
      chunks.push(chunk);
    });
    request.once("end", () => {
      if (size > 64_000) return;
      try {
        resolveBody(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, size)));
      } catch (error) {
        rejectBody(error);
      }
    });
    request.once("error", rejectBody);
    request.once("aborted", () => rejectBody(new Error("请求已取消。")));
  });
}

function limitOutput(text) {
  if (text.length <= maxOutputLength) return text;
  const limited = text.slice(0, maxOutputLength);
  return limited.replace(/[\uD800-\uDBFF]$/, "");
}

function runCommand(command, args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let didTimeOut = false;
    let stdoutLimitReached = false;
    let stderrLimitReached = false;
    const timer = setTimeout(() => {
      didTimeOut = true;
      child.kill("SIGKILL");
    }, options.timeoutMs || runTimeoutMs);
    const abort = () => child.kill("SIGKILL");
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener("abort", abort, { once: true });
    const cleanup = () => {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      if (stdoutLimitReached) return;
      if (stdout.length + chunk.length > maxOutputLength) {
        stdoutLimitReached = true;
        child.kill("SIGKILL");
      }
      stdout = limitOutput(stdout + chunk);
    });
    child.stderr.on("data", (chunk) => {
      if (stderrLimitReached) return;
      if (stderr.length + chunk.length > maxOutputLength) {
        stderrLimitReached = true;
        child.kill("SIGKILL");
      }
      stderr = limitOutput(stderr + chunk);
    });
    child.on("error", (error) => {
      cleanup();
      resolveRun({ ok: false, missingCommand: error.code === "ENOENT", error, stdout, stderr });
    });
    child.on("close", (code) => {
      cleanup();
      const didExceedOutput = stdoutLimitReached || stderrLimitReached;
      resolveRun({
        ok: code === 0 && !didTimeOut && !didExceedOutput,
        code,
        didTimeOut,
        didExceedOutput,
        stdout: stdout.slice(0, maxOutputLength),
        stderr: stderr.slice(0, maxOutputLength)
      });
    });

    child.stdin.on("error", () => {
      // Java can exit before it consumes the request input.
    });
    child.stdin.end(options.stdin);
  });
}

let javaStatus;
let javaStatusCheckedAt = 0;
let checkingJava;

async function getJavaStatus() {
  if (javaStatus && Date.now() - javaStatusCheckedAt < (javaStatus.available ? 60_000 : 5_000)) {
    return javaStatus;
  }

  if (!checkingJava) {
    checkingJava = runCommand("java", ["--version"], { timeoutMs: 4_000 }).then((java) => {
      javaStatusCheckedAt = Date.now();
      javaStatus = {
        available: java.ok,
        demoMode: !java.ok,
        version: [java.stdout, java.stderr].filter(Boolean).join("\n").trim(),
        message: java.ok ? "服务端 Java 运行环境可用。" : "未找到可用的 JDK，使用课程预览。"
      };
      return javaStatus;
    }).finally(() => {
      checkingJava = null;
    });
  }
  return checkingJava;
}

async function handleRun(request, response) {
  if (request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    sendJson(response, 415, { status: "error", stderr: "请发送 application/json 请求。" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch (error) {
    const statusCode = error.statusCode || 400;
    sendJson(response, statusCode, {
      status: "error",
      stderr: statusCode === 413 ? error.message : "请求格式不是有效的 JSON。"
    });
    return;
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      typeof payload.code !== "string" || (payload.stdin !== undefined && typeof payload.stdin !== "string") ||
      (payload.args !== undefined && !Array.isArray(payload.args))) {
    sendJson(response, 400, { status: "error", stderr: "代码和输入必须是文本，命令行参数必须是列表。" });
    return;
  }

  const { code, stdin = "" } = payload;
  const args = (payload.args || []).slice(0, 12).map(String);

  if (!code.trim()) {
    sendJson(response, 400, { status: "error", stderr: "No code submitted." });
    return;
  }
  if (code.length > maxCodeLength) {
    sendJson(response, 400, { status: "error", stderr: "Code exceeds the 20000 character limit." });
    return;
  }

  const javaStatus = await getJavaStatus();
  if (response.destroyed) return;
  if (!javaStatus.available) {
    sendJson(response, 200, runTeachingPreview(code));
    return;
  }

  const workDir = join(tmpdir(), `java-path-${randomUUID()}`);
  const startTime = Date.now();
  const controller = new AbortController();
  const abort = () => controller.abort();
  response.once("close", abort);
  try {
    await mkdir(workDir, { recursive: true });
    await writeFile(join(workDir, "Main.java"), code, "utf8");

    const result = await runCommand("java", ["Main.java", ...args], {
      cwd: workDir,
      stdin,
      signal: controller.signal,
      timeoutMs: runTimeoutMs
    });
    if (controller.signal.aborted) return;

    let status = result.ok ? "success" : "compile-or-runtime-error";
    let stderr = result.stderr || result.error?.message || "";
    if (result.didExceedOutput) {
      status = "output-limit";
      stderr += "\n程序输出超过 " + maxOutputLength + " 字符，已停止。";
    } else if (result.didTimeOut) {
      status = "timeout";
      stderr += "\n程序运行超过 " + runTimeoutMs / 1000 + " 秒，已停止。";
    }

    sendJson(response, 200, {
      status,
      stdout: result.stdout,
      stderr,
      durationMs: Date.now() - startTime
    });
  } catch (error) {
    if (controller.signal.aborted) return;
    sendJson(response, 500, {
      status: "server-error",
      stdout: "",
      stderr: `运行服务出错：${error.message}`,
      durationMs: Date.now() - startTime
    });
  } finally {
    response.off("close", abort);
    await rm(workDir, { recursive: true, force: true }).catch((error) => {
      console.error("临时目录清理失败", error.message);
    });
  }
}

async function serveStatic(requestUrl, response) {
  let rawPath;
  try {
    rawPath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  } catch {
    sendText(response, 400, "Bad request");
    return;
  }

  const filePath = resolve(publicDir, rawPath.replace(/^\/+/, ""));
  const relativePath = relative(publicDir, filePath);
  const isInsidePublicDir =
    relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath);

  if (!isInsidePublicDir || !existsSync(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  try {
    const content = await readFile(filePath);
    const contentType = mimeTypes.get(extname(filePath)) || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache"
    });
    response.end(content);
  } catch {
    sendText(response, 500, "Unable to read file.");
  }
}

function acceptsLocalRun(request) {
  const hosts = request.headersDistinct.host;
  if (hosts?.length !== 1) return false;
  const authority = hosts[0].toLowerCase();
  const port = request.socket.localPort;
  const localHosts = ["localhost", "127.0.0.1"];
  if (!localHosts.some(name => authority === `${name}:${port}` || (port === 80 && authority === name))) {
    return false;
  }
  const origins = request.headersDistinct.origin;
  const expectedOrigin = "http://" + authority.replace(/:80$/, "");
  return !origins || (origins.length === 1 && origins[0] === expectedOrigin);
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, "http://127.0.0.1");
    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      sendJson(response, 200, await getJavaStatus());
      return;
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/run") {
      if (!acceptsLocalRun(request)) {
        sendJson(response, 403, { status: "error", stderr: "Java 运行服务仅接受本机地址。" });
        return;
      }
      await handleRun(request, response);
      return;
    }
    if (request.method === "GET") {
      await serveStatic(requestUrl, response);
      return;
    }
    sendText(response, 405, "Method not allowed");
  } catch {
    sendText(response, 500, "Internal server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log("java-path is running at http://127.0.0.1:" + server.address().port);
});
