import {
  valder,
  sin,
  cos,
  tan,
  asin,
  acos,
  atan,
  mul,
  div,
  neg,
  plus,
  minus,
  exp,
  sqrt,
  log,
  power
} from './autodiff.js';
import { parse, tokenize } from "./parser-combinator.js";
import { evaluate, compile as compileHelper } from "./evaluate-combinator.js";
import { evaluate as ogEvaluate } from "./evaluate.js";

let val;

console.time("og")
val = ogEvaluate("sin(x)", { x: 4, y: 5, z: 0 })
console.timeEnd("og")
console.log(val)

console.time("new")
val = evaluate("sin(x)", { x: 4, y: 5, z: 0 })
console.timeEnd("new")
console.log(val)

const compile = (args, expression) => {
  const toks = tokenize(expression);

  const [ ast, remainder ] = parse(toks);
  console.log(ast);
  if (remainder.length > 0) console.log("error:", ast, remainder);
  // console.log(ast)
  return compileHelper(args, ast);
}

// first forward substitute 
// coincident
// vertical
// horizontal
// fix (x, y)

const test = compile(["x", "y", "z"], "sin(x)");
console.time("newer")
val = test(4, 5, 0);
console.timeEnd("newer")
console.log(val)


function distance(d, p1x, p1y, p2x, p2y) { // takes valder for p1 and p2
  return minus(
    d, 
    sqrt(
      plus(
        power(minus(p2x, p1x), 2), 
        power(minus(p2y, p1y), 2)
      )
    )
  );
};


// or hard code it
function distanceFast(d, p1x, p1y, p2x, p2y) {
  const dp2x = -(p2x - p1x)/Math.sqrt((p2x - p1x)**2 + (p2y - p1y)**2)
  const dp1x = (p2x - p1x)/Math.sqrt((p2x - p1x)**2 + (p2y - p1y)**2)
  const dp2y = -(p2y - p1y)/Math.sqrt((p2x - p1x)**2 + (p2y - p1y)**2)
  const dp1y = (p2y - p1y)/Math.sqrt((p2x - p1x)**2 + (p2y - p1y)**2)
  const cost = d - Math.sqrt( (p2x - p1x)**2 + (p2y - p1y)**2 );
  
  return [ cost, dp1x, dp1y, dp2x, dp2y ];
};

let d = 9
let p0 = [4, 2]
let p1 = [0, 23]

console.time("og")
const og =  distance(d, 
    valder(p0[0], [1, 0, 0, 0]), 
    valder(p0[1], [0, 1, 0, 0]), 
    valder(p1[0], [0, 0, 1, 0]), 
    valder(p1[1], [0, 0, 0, 1])
    );
console.timeEnd("og")
console.log("og", og)

console.time("new")
const fast = distanceFast(d, p0[0], p0[1], p1[0], p1[1]);
console.timeEnd("new")
console.log("fast?", fast);







