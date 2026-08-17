// Safe arithmetic expression evaluator (no eval/Function) shared by the text-based
// Scientific Calculator page and the interactive keypad calculator widgets.
// Supports + - * / ^, parentheses, unary minus, postfix ! and %, and named functions.

type Token = { type: "num" | "op" | "lparen" | "rparen" | "postfix" | "ident"; value: string };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push({ type: "num", value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++;
      tokens.push({ type: "ident", value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === "(") { tokens.push({ type: "lparen", value: c }); i++; continue; }
    if (c === ")") { tokens.push({ type: "rparen", value: c }); i++; continue; }
    if (c === "!") { tokens.push({ type: "postfix", value: c }); i++; continue; }
    if (c === "%") { tokens.push({ type: "postfix", value: c }); i++; continue; }
    if ("+-*/^".includes(c)) { tokens.push({ type: "op", value: c }); i++; continue; }
    throw new Error(`Unexpected character: ${c}`);
  }
  return tokens;
}

function factorial(k: number): number {
  if (k < 0 || !Number.isInteger(k) || k > 170) return NaN;
  let r = 1;
  for (let x = 2; x <= k; x++) r *= x;
  return r;
}

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: (x) => Math.sin(x), cos: (x) => Math.cos(x), tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x), acos: (x) => Math.acos(x), atan: (x) => Math.atan(x),
  sinh: (x) => Math.sinh(x), cosh: (x) => Math.cosh(x), tanh: (x) => Math.tanh(x),
  sqrt: (x) => Math.sqrt(x), cbrt: (x) => Math.cbrt(x),
  log: (x) => Math.log10(x), ln: (x) => Math.log(x),
  abs: (x) => Math.abs(x), exp: (x) => Math.exp(x),
};
const TRIG_FUNCTIONS = new Set(["sin", "cos", "tan", "asin", "acos", "atan"]);
const INVERSE_TRIG = new Set(["asin", "acos", "atan"]);
const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

class Parser {
  tokens: Token[];
  pos = 0;
  degrees: boolean;
  constructor(tokens: Token[], degrees: boolean) {
    this.tokens = tokens;
    this.degrees = degrees;
  }
  peek() { return this.tokens[this.pos]; }
  next() { return this.tokens[this.pos++]; }
  parseExpr(): number {
    let left = this.parseTerm();
    while (this.peek() && this.peek().type === "op" && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.next().value;
      const right = this.parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }
  parseTerm(): number {
    let left = this.parsePow();
    while (this.peek() && this.peek().type === "op" && (this.peek().value === "*" || this.peek().value === "/")) {
      const op = this.next().value;
      const right = this.parsePow();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }
  parsePow(): number {
    const base = this.parsePostfix();
    if (this.peek() && this.peek().type === "op" && this.peek().value === "^") {
      this.next();
      const exp = this.parsePow(); // right-associative
      return Math.pow(base, exp);
    }
    return base;
  }
  parsePostfix(): number {
    let val = this.parseUnary();
    while (this.peek() && this.peek().type === "postfix") {
      const op = this.next().value;
      val = op === "!" ? factorial(val) : val / 100;
    }
    return val;
  }
  parseUnary(): number {
    if (this.peek() && this.peek().type === "op" && this.peek().value === "-") {
      this.next();
      return -this.parseUnary();
    }
    return this.parseAtom();
  }
  parseAtom(): number {
    const tok = this.peek();
    if (!tok) throw new Error("Unexpected end of expression");
    if (tok.type === "num") { this.next(); return Number(tok.value); }
    if (tok.type === "lparen") {
      this.next();
      const val = this.parseExpr();
      if (!this.peek() || this.peek().type !== "rparen") throw new Error("Missing closing parenthesis");
      this.next();
      return val;
    }
    if (tok.type === "ident") {
      this.next();
      const name = tok.value.toLowerCase();
      if (this.peek() && this.peek().type === "lparen") {
        this.next();
        const arg = this.parseExpr();
        if (!this.peek() || this.peek().type !== "rparen") throw new Error("Missing closing parenthesis");
        this.next();
        const fn = FUNCTIONS[name];
        if (!fn) throw new Error(`Unknown function: ${name}`);
        const input = this.degrees && TRIG_FUNCTIONS.has(name) && !INVERSE_TRIG.has(name) ? (arg * Math.PI) / 180 : arg;
        const output = fn(input);
        return this.degrees && INVERSE_TRIG.has(name) ? (output * 180) / Math.PI : output;
      }
      if (name in CONSTANTS) return CONSTANTS[name];
      throw new Error(`Unknown identifier: ${name}`);
    }
    throw new Error("Unexpected token");
  }
}

export function evaluateExpression(expr: string, degrees: boolean): number {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens, degrees);
  const result = parser.parseExpr();
  if (parser.pos !== tokens.length) throw new Error("Unexpected trailing input");
  return result;
}
