const OPERATORS = [
  ["+", "-"],
  ["*", "/"],
  ["^", /* "**" */ ]
];

const PRECEDENCE = Object.fromEntries(
  OPERATORS.map((level, i) => level.map(op => [op, i + 1])).flat()
);

class InputStream {
  constructor(string) {
    this.pos = 0;
    this.line = 1;
    this.col = 0;
    this.input = string;
  }

  next() {
    let ch = this.input.charAt(this.pos++);
    if (ch === "\n") this.line++, this.col = 0;
    else this.col++;
    return ch;
  }

  peek(offset = 0) {
    return this.input.charAt(this.pos + offset);
  }
  eof() {
    return this.peek() === "";
  }
  croak(msg) {
    throw new Error(msg + " (" + this.line + ":" + this.col + ")");
  }
}

// predicates
const is_digit = (ch) => /[0-9]/i.test(ch);
const is_symbol_start = (ch) => /[a-z]/i.test(ch);
const is_symbol = (ch) => is_symbol_start(ch) || "0123456789_".indexOf(ch) >= 0;
const is_op_char = (ch) => /[\+\-\*\/\^]/.test(ch); // TODO: need to get unary operators working, should "." be an op
const is_whitespace = (ch) => " \t\r\n".indexOf(ch) >= 0;

function TokenStream(string) {
  let input = new InputStream(string);

  let current = null;
  let list_depth = 0;

  return {
    next: next,
    peek: peek,
    eof: eof,
    croak: input.croak
  };


  // helper to read
  function read_while(predicate) {
    let ch = input.peek();
    let str = "";
    while (!input.eof() && predicate(input.peek()))
      str += input.next();
    return str;
  }

  // read symbol
  function read_symbol() {
    const value = read_while(is_symbol).toLowerCase();
    if (input.peek() === "(") return {
      type: "call",
      value
    }
    else return {
      type: "symbol",
      value
    }
  }

  // read number
  function read_number() {
    let dots_seen = 0;
    let number = read_while(function(ch) {
      if (ch === ".") {
        dots_seen++;
        if (dots_seen > 1) input.croak("Multiple decimals in number.")
        return true;
      } else return is_digit(ch);
    });

    return {
      type: "number",
      value: parseFloat(number)
    };
  }

  // reading
  function read_token() {
    read_while(is_whitespace);

    if (input.eof()) return null;

    let ch = input.peek();

    // does this have some order
    if (is_op_char(ch)) {
      const value = read_while(is_op_char);
      return {
        type: "op",
        value
      };
    }
    if (is_symbol_start(ch)) return read_symbol();
    if (is_digit(ch) || ch === ".") return read_number();
    if (ch === "(") return {
      type: "left-paren",
      value: input.next()
    };
    if (ch === ")") return {
      type: "right-paren",
      value: input.next()
    };

    input.croak("Can't handle character: " + ch);
  }

  function peek() {
    return current || (current = read_token());
  }

  function next() {
    var tok = current;
    current = null;
    return tok || read_token();
  }

  function eof() {
    return peek() === null;
  }
}

export function parse(string) {
  const input = TokenStream(string);
  return parse_expression();

  function is_paren(ch) {
    var tok = input.peek();
    return tok.type && tok && tok.type.includes("paren") && (!ch || tok.value === ch) && tok;
  }

  function skip_paren(ch) {
    if (is_paren(ch)) input.next();
    else input.croak("Expecting punctuation: \"" + ch + "\"");
  }

  function is_op(op) {
    var tok = input.peek();
    return tok && tok.type === "op" && (!op || tok.value === op) && tok;
  }

  function unexpected() {
    input.croak("Unexpected token: " + JSON.stringify(input.peek()));
  }

  function maybe_binary(left, my_prec) {
    var tok = is_op();
    if (!tok) return left; // guard statement

    var his_prec = PRECEDENCE[tok.value];
    if (his_prec > my_prec) {
      input.next();

      return maybe_binary({
        type: "binary",
        operator: tok.value,
        left: left,
        right: parse_expression(his_prec)
      }, my_prec);
    } else {
      return left;
    }
  }

  function parse_call() {
    const call = input.next();
    skip_paren("(");
    const args = [];
    while (!is_paren(")")) args.push(parse_expression());
    skip_paren(")");
    call.args = args;
    return call;
  }

  function parse_atom() {
    if (is_paren("(")) {
      let exp;
      skip_paren("(")
      exp = parse_expression();
      skip_paren(")");
      return exp;
    }

    // need to parse calls
    if (input.peek().type === "call") return parse_call();

    var tok = input.next();
    const literals = ["number", "symbol"];
    if (literals.includes(tok.type)) return tok;

    unexpected();
  }

  function parse_expression(prec = 0) {
    return maybe_binary(parse_atom(), prec);
  }
}