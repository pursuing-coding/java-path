import { stripSourceComments } from "./submission-grading.js";

const javaString = '"(?:\\\\[btnfrs\'"\\\\]|[^"\\\\\\r\\n])*"';
const tokenPattern = new RegExp(String.raw`(?:${javaString}|-?(?:0|[1-9][0-9]*)|[A-Za-z_$][\w$]*)`, "y");
const declaration = /^(String|int|boolean)\s+([A-Za-z_$][\w$]*)\s*=/;
const print = /^System\s*\.\s*out\s*\.\s*(println|print)\s*\(/;
const escapes = { b: "\b", t: "\t", n: "\n", f: "\f", r: "\r", s: " ", "'": "'", '"': '"', "\\": "\\" };
const reservedNames = new Set("abstract assert boolean break byte case catch char class const continue default do double else enum extends false final finally float for goto if implements import instanceof int interface long native new null package private protected public return short static strictfp super switch synchronized this throw throws transient true try void volatile while _ var yield record sealed permits".split(" "));
const maxSourceLength = 20_000;
const maxTextLength = 12_000;

function readValue(text, variables) {
  tokenPattern.lastIndex = 0;
  const match = tokenPattern.exec(text);
  if (!match) return null;
  const token = match[0];
  const remaining = text.slice(token.length).trimStart();
  if (token.startsWith('"')) {
    const value = token.slice(1, -1).replace(/\\(.)/g, (_, escape) => escapes[escape]);
    return value.length <= maxTextLength ? { type: "String", value, remaining } : null;
  }
  if (/^-?\d/.test(token)) {
    const value = Number(token);
    return value >= -2147483648 && value <= 2147483647 ? { type: "int", value, remaining } : null;
  }
  if (/^(true|false)$/.test(token)) return { type: "boolean", value: token === "true", remaining };
  return variables.has(token) ? { ...variables.get(token), remaining } : null;
}

function readExpression(text, variables) {
  let expression = readValue(text.trimStart(), variables);
  while (expression?.remaining.startsWith("+")) {
    const right = readValue(expression.remaining.slice(1).trimStart(), variables);
    if (!right) return null;
    if (expression.type === "String" || right.type === "String") {
      const leftText = String(expression.value);
      const rightText = String(right.value);
      if (leftText.length + rightText.length > maxTextLength) return null;
      expression = { type: "String", value: leftText + rightText, remaining: right.remaining };
    } else if (expression.type === "int" && right.type === "int") {
      expression = { type: "int", value: (expression.value + right.value) | 0, remaining: right.remaining };
    } else {
      return null;
    }
  }
  return expression;
}

function previewOutput(code) {
  if (typeof code !== "string" || code.length > maxSourceLength || /\\u/.test(code)) return null;
  const program = /^\s*(?:public\s+)?class\s+Main\s*\{\s*public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*([A-Za-z_$][\w$]*)\s*\)\s*\{([\s\S]*)\}\s*\}\s*$/.exec(stripSourceComments(code));
  if (!program || reservedNames.has(program[1]) || program[1] === "System") return null;

  const variables = new Map();
  let remaining = program[2].trim();
  let output = "";
  while (remaining) {
    const variable = declaration.exec(remaining);
    if (variable) {
      const [, type, name] = variable;
      if (reservedNames.has(name) || name === "System" || name === program[1] || variables.has(name)) return null;
      const expression = readExpression(remaining.slice(variable[0].length), variables);
      if (expression?.type !== type || !expression.remaining.startsWith(";")) return null;
      variables.set(name, { type, value: expression.value });
      remaining = expression.remaining.slice(1).trimStart();
      continue;
    }

    const call = print.exec(remaining);
    if (!call) return null;
    const argument = remaining.slice(call[0].length).trimStart();
    const expression = call[1] === "println" && argument.startsWith(")")
      ? { value: "", remaining: argument }
      : readExpression(argument, variables);
    const terminator = /^\)\s*;\s*/.exec(expression?.remaining ?? "");
    if (!terminator) return null;
    const printed = String(expression.value);
    const newline = call[1] === "println" ? "\n" : "";
    if (output.length + printed.length + newline.length > maxTextLength) return null;
    output += printed + newline;
    remaining = expression.remaining.slice(terminator[0].length);
  }
  return output;
}

export function runTeachingPreview(code) {
  let output = null;
  try {
    output = previewOutput(code);
  } catch {
    // Always give the caller a final result, even if the evaluator fails.
  }
  return output === null
    ? {
        status: "preview-limited",
        stdout: "",
        stderr: "当前程序超出网页预览范围。请使用本地 JDK 编译和运行。",
        durationMs: 0
      }
    : {
        status: "learning-preview",
        stdout: output,
        stderr: "教学预览支持基本输出、简单变量和字符串拼接。完整运行请使用本地 JDK。",
        durationMs: 0
      };
}
