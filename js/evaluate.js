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

import { parse as combParse, tokenize } from "./parser-combinator.js";

import { parse } from "./parser.js";

const treeTraversal = (node, vars) => {
  if (node.type === "number") {
    return parseFloat(node.value);
  } else if (node.type === "binary") {
    let left = treeTraversal(node.left, vars);
    let right = treeTraversal(node.right, vars);
    switch (node.operator) {
      case "+": return plus(left, right);
      case "*": return mul(left, right);
      case "/": return div(left, right);
      case "-": return minus(left, right);
      case "^": return power(left, right); //TODO: this is only for whole numbers, if negative doesnt work
      case "**": return power(left, right);
    }
  } else if (node.type === "symbol") {
    let variable = node.value;
    let valder = vars[variable];
    return valder;
  } else if (node.type === "call") {
    let args = node.args.map(x => treeTraversal(x, vars));
    switch (node.value) {
      case "sin": return sin(...args);
      case "cos": return cos(...args);
      case "tan": return tan(...args);
      case "asin": return asin(...args); // TODO: this may be off
      case "acos": return acos(...args);
      case "atan": return atan(...args);
      case "exp": return exp(...args);
      case "sqrt": return sqrt(...args);
      case "log": return log(...args);
      case "neg": return neg(...args);
    }
  }
}

const calculate = (exp, vars) => {
  const ast = parse(exp);
  // console.log("p0", ast)
  // console.log(ast)
  return treeTraversal(ast, vars);
}

//takes (equation, [var, var...]) where e.g. var = {'x':'3'}
export function evaluate(eq, variables) {
  let valder_vars = {};
  let length = Object.keys(variables).length;

  Object.keys(variables).forEach((key, index) => {
    let partial_der = Array.apply(null, Array(length)).map(Number.prototype.valueOf, 0);
    partial_der[index] = 1;
    let temp = valder(variables[key], partial_der)
    valder_vars[key] = temp;
  })

  // const toks = tokenize(eq);

  // const result = combParse(toks);

  // const [ ast, remainder ] = result;

  // return treeTraversal(ast, valder_vars);



  return calculate(eq, valder_vars);
};



const compileHelper = (argList, node) => (...args) => {
  if (node.type === "number") return parseFloat(node.value);
  else if (node.type === "binary") {
    let left = compileHelper(argList, node.left)(...args);
    let right = compileHelper(argList, node.right)(...args);
    switch (node.operator) {
      case "+": return plus(left, right);
      case "*": return mul(left, right);
      case "/": return div(left, right);
      case "-": return minus(left, right);
      case "^": return power(left, right); //TODO: this is only for whole numbers, if negative doesnt work
      // case "**": return power(left, right);
    }
  } else if (node.type === "exp") {
    return compileHelper(argList, node.value)(...args);
  } else if (node.type === "symbol") {
    let variable = node.value;
    let index = argList.indexOf(variable);
    const jacobian = argList.map(x => x === variable ? 1 : 0);
    return valder(args[index], jacobian);
  } else if (node.type === "call") {
    let newArgs = node.args.map(x => compileHelper(argList, x)(...args));
    switch (node.value) {
      case "sin": return sin(...newArgs);
      case "cos": return cos(...newArgs);
      case "tan": return tan(...newArgs);
      case "asin": return asin(...newArgs); // TODO: this may be off
      case "acos": return acos(...newArgs);
      case "atan": return atan(...newArgs);
      case "exp": return exp(...newArgs);
      case "sqrt": return sqrt(...newArgs);
      case "log": return log(...newArgs);
      case "neg": return neg(...newArgs);
    }
  }
}

export const compile = (args, expression) => {
  const toks = tokenize(expression);

  const result = combParse(toks);

  const [ ast, remainder ] = result;

  // console.log("p1", ast);

  // const ast = parse(exp);

  if (remainder > 0) console.log(remainder);

  return compileHelper(args, ast);
}



