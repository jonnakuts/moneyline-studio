/**
 * Tiny, safe arithmetic evaluator for derived facts. Supports fact IDs, numbers, + - * / ( ) and
 * unary minus. No eval(), no functions, no other syntax.
 */

type Token =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: "+" | "-" | "*" | "/" }
  | { t: "lp" }
  | { t: "rp" };

export function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      const m = /^[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/i.exec(src.slice(i));
      if (!m) throw new Error(`Bad number at "${src.slice(i)}"`);
      out.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-z]/.test(c)) {
      const m = /^[a-z0-9][a-z0-9-]*/.exec(src.slice(i))!;
      // A trailing "-" belongs to subtraction, not the ID.
      const id = m[0].replace(/-+$/, "");
      out.push({ t: "id", v: id });
      i += id.length;
    } else if ("+-*/".includes(c)) {
      out.push({ t: "op", v: c as "+" | "-" | "*" | "/" });
      i++;
    } else if (c === "(") {
      out.push({ t: "lp" });
      i++;
    } else if (c === ")") {
      out.push({ t: "rp" });
      i++;
    } else {
      throw new Error(`Unexpected character "${c}" in formula "${src}"`);
    }
  }
  return out;
}

/** IDs referenced by a formula. */
export function formulaIds(src: string): string[] {
  return [...new Set(tokenize(src).flatMap((t) => (t.t === "id" ? [t.v] : [])))];
}

export function evaluate(src: string, lookup: (id: string) => number): number {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];

  function expr(): number {
    let v = term();
    for (let t = peek(); t && t.t === "op" && (t.v === "+" || t.v === "-"); t = peek()) {
      p++;
      const r = term();
      v = t.v === "+" ? v + r : v - r;
    }
    return v;
  }
  function term(): number {
    let v = factor();
    for (let t = peek(); t && t.t === "op" && (t.v === "*" || t.v === "/"); t = peek()) {
      p++;
      const r = factor();
      if (t.v === "/" && r === 0) throw new Error(`Division by zero in "${src}"`);
      v = t.v === "*" ? v * r : v / r;
    }
    return v;
  }
  function factor(): number {
    const t = toks[p++];
    if (!t) throw new Error(`Unexpected end of formula "${src}"`);
    if (t.t === "num") return t.v;
    if (t.t === "id") return lookup(t.v);
    if (t.t === "op" && t.v === "-") return -factor();
    if (t.t === "lp") {
      const v = expr();
      if (toks[p++]?.t !== "rp") throw new Error(`Missing ")" in "${src}"`);
      return v;
    }
    throw new Error(`Unexpected token in "${src}"`);
  }

  const v = expr();
  if (p !== toks.length) throw new Error(`Trailing tokens in formula "${src}"`);
  return v;
}
