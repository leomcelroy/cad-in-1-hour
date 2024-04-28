const oneOf = item => w => w.startsWith(item);
const anyOf = arr => w => arr.some(oneOf(w));

const OPERATORS = [
  ["+", "-"],
  ["*", "/"],
  ["^", /* "**" */ ]
];

const PRECEDENCE = Object.fromEntries(
  OPERATORS.map((level, i) => level.map(op => [op, i + 1])).flat()
);

const skip = ["ws"];
const literals = ["+", "-", "*", "/", "^", "(", ")", ","];

const tokenRules = {
  ws: /\s+/,
  symbol: /[a-zA-Z][a-zA-Z\d-]*/,
  number: /[-]?([0-9]+\.?[0-9]*|\.[0-9]+)/,
  literal: anyOf(literals),
}

const regExFunc = regex => string => { // not used
  const match = string.match(regex); 
  return match && match[0] === string;
}

const makeTest = (rule, start = false) => // not used
  rule instanceof RegExp ? regExFunc(rule)
  : typeof rule === "string" ? x => rule.startsWith(x)
  : Array.isArray(rule) ? x => rule.map(makeTest).some(f => f(x))
  : rule; // is function

const makeTokenizer = (rules, { skip = [], literals = [] } = { }) => string => { 
  let index = 0;
  const peek = () => string[index];
  // const next = () => string[index++];
  const tokens = [];

  while (index < string.length) {
    let type, value;

    for (const key in rules) {
      type = key;
      value = null;
      let rule = rules[key];
      if (rule instanceof RegExp) {
        let tempValue = string.slice(index).match(rule);

        if (tempValue !== null && tempValue.index === 0) {
          value = tempValue[0];        
          break;
        }
      } else if (typeof rule === "function") {
        if (rule(peek())) {
          let i = index;
          value = string[i]
          while (rule(value)) {
            if(rule(value + string[i + 1])) value += string[++i];
            else break;
          }
          break;
        }
      }
    }

    if (value === undefined || value === null) throw `Unknown character: ${peek()}`
    if (literals.includes(value)) type = value;
    if (!skip.includes(type)) tokens.push({ type, value, index });
    index += value.length;

  }

  return tokens;
}

//////////////////////////////

const convert = pred => s => {
  return s[0] && (s[0].type === pred)
    ? [ s[0], s.slice(1) ] 
    : null
}

const star = (pred, transform = null) => s => { // 0 or more
  if (typeof pred === "string") pred = convert(pred);

  const arr = [];
  let next = pred(s);

  while (next) {
    arr.push(next);
    next = pred(next[1]);
  }

  return arr.length > 0 
    ? [ ( transform ? transform(arr.map(([x]) => x)) : arr.map(([x]) => x) ), arr[arr.length - 1][1] ] 
    : [[], s];
}

const plus = (pred, transform = null) => s => { // at least one
  if (typeof pred === "string") pred = convert(pred);

  const arr = [];
  let next = pred(s);

  while (next) {
    arr.push(next);
    next = pred(next[1]);
  }

  return arr.length > 0 
    ? [ ( transform ? transform(arr.map(([x]) => x)) : arr.map(([x]) => x) ), arr[arr.length - 1][1] ] 
    : null;
}

const or = (preds, transform = null) => s => {
    const result = preds.reduce((acc, cur) => 
        acc || (typeof cur === "string" ? convert(cur) : cur)(s)
      , false);

    return Array.isArray(result) 
      ? (transform ? [ transform(result[0]), result[1] ] : result)
      : null;
}

const and = (preds, transform = null) => s => { // must match each predicate
  const result = [];
  for (let pred of preds) {
    if (typeof pred === "string") pred = convert(pred);

    const next = pred(s);
    if (next === null) return null;
    s = next[1];
    result.push(next[0])
  }
  
  return result.length === preds.length 
    ? [transform ? transform(result) : result, s] 
    : null;
}

const opt = pred => s => { // optional
  if (typeof pred === "string") pred = convert(pred);

  const next = pred(s);
  if (next === null) return [null, s]; // should I use null or []
  else return next;
}

const trim = pred => or([ // not used
  and(["ws", pred, "ws"], ([_0, x, _1]) => x),
  and([pred, "ws"], ([x, _]) => x),
  and(["ws", pred], ([_, x]) => x),
  pred
])

const none = () => s => [ null, s ]; // not used

const any = () => s => [ s[0], s.slice(1) ]; // not used

///////////////////

class Stream { // not used
  constructor(ast) {
    this.index = 0;
    this.ast = ast;
  }

  peek() {
    return this.ast[this.index];
  }

  next() {
    const current = this.ast[this.index];
    this.index++;
    return current;
  }

  eof() {
    return this.peek() === undefined;
  }
}

//////////////////////////////

export const tokenize = makeTokenizer(tokenRules, { skip, literals });

const convertBi = x => {
  if (x[2].type === "binary" && PRECEDENCE[x[2].operator] < PRECEDENCE[x[1].value]) {
    return convertBi([
        convertBi([ x[0], x[1], x[2].left ]),
        { type: x[2].operator, value: x[2].operator },
        x[2].right, 
    ])
  } else {
    return { type: "binary", left: x[0], right: x[2], operator: x[1].value }
  }
}

const prog = s => or([
  bi,
  exp,
  "symbol",
  "number"
])(s);

const convertArgs = x => x[0] === null ? [ x[1] ] : [...x[0], x[1]];
const args = s => and([
  opt(
    plus(and([ prog, "," ]), x => x.map( y => y[0] )), 
  ),
  prog
], convertArgs)(s)

const convertCall = x => ({ type: "call", value: x[0].value, args: x[2] });
const exp = s => or([
  and(["symbol", "(", args, ")"], convertCall),
  and(["(", prog, ")"], x => ({ type: "exp", value: x[1] })),
  "symbol",
  "number"
])(s);

const bi = s => and([
    exp, 
    or(OPERATORS.flat()), 
    prog
  ], convertBi)(s)

export const parse = prog;



