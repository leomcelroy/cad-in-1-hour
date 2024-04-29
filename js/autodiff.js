function valder (val, der) {
  return {
    type: "valder",
    val: val,
    der: der,
  }
}

const sin = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.sin(x);
  } else if (x.type === "valder") {
    return valder(sin(x.val), x.der.map(temp => mul(temp, cos(x.val))));
  }
}

const cos = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.cos(x);
  } else if (x.type === "valder") {
    return valder(cos(x.val), x.der.map(temp => mul(neg(temp), sin(x.val))));
  }
}

const tan = (x) => { //need baseDiv
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.tan(x);
  } else if (x.type === "valder") {
    return valder(tan(x.val), x.der.map(temp => div(temp, mul(cos(x.val), cos(x.val)))));
  }
}

const asin = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.asin(x);
  } else if (x.type === "valder") {
    return valder(asin(x.val), x.der.map(temp => div(temp, sqrt(minus(1, mul(x.val, x.val))))));
  }
}

const acos = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.acos(x);
  } else if (x.type === "valder") {
    return valder(acos(x.val), x.der.map(temp => div(neg(temp), sqrt(minus(1, mul(x.val, x.val))))));
  }
}

const atan = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.atan(x);
  } else if (x.type === "valder") {
    return valder(atan(x.val), x.der.map(temp => div(temp, plus(1, mul(x.val, x.val)))));
  }
}

const mul = (x0, x1) => {
  if ((typeof x0 === "number") && (typeof x1 === "number") && !isNaN(x0) && !isNaN(x1)) {
    return x0 * x1
  } else if ((x0.type === "valder") || (x1.type === "valder")) {

    if ((typeof x0 === "number") && (typeof x1 !== "number")) {
      x0 = valder(x0, x1.der.map(temp => 0));
    }

    if ((typeof x1 === "number") && (typeof x0 !== "number")) {
      x1 = valder(x1, x0.der.map(temp => 0));
    }

    return valder(mul(x0.val, x1.val), x1.der.map((temp, index) => plus(mul(temp, x0.val), mul(x1.val, x0.der[index]))));
  }
}

const div = (x0, x1) => {
  if ((typeof x0 === "number") && (typeof x1 === "number") && !isNaN(x0) && !isNaN(x1)) {
    return x0 / x1
  } else if ((x0.type === "valder") || (x1.type === "valder")) {

    if ((typeof x0 === "number") && (typeof x1 !== "number")) {
      x0 = valder(x0, x1.der.map(temp => 0));
    }

    if ((typeof x1 === "number") && (typeof x0 !== "number")) {
      x1 = valder(x1, x0.der.map(temp => 0));
    }

    return valder(div(x0.val, x1.val), x0.der.map((temp, index) => div(minus(mul(x1.val, temp), mul(x0.val, x1.der[index])), mul(x1.val, x1.val))))
  }
}

const neg = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return -x;
  } else if (x.type === "valder") {
    return valder(neg(x.val), x.der.map(temp => neg(temp)));
  }
}

const plus = (x0, x1) => {
  if ((typeof x0 === "number") && (typeof x1 === "number") && !isNaN(x0) && !isNaN(x1)) {
    return x0 + x1
  } else if ((x0.type === "valder") || (x1.type === "valder")) {

    if ((typeof x0 === "number") && (typeof x1 !== "number")) {
      x0 = valder(x0, x1.der.map(temp => 0));
    }

    if ((typeof x1 === "number") && (typeof x0 !== "number")) {
      x1 = valder(x1, x0.der.map(temp => 0));
    }

    return valder(plus(x0.val, x1.val), x0.der.map((temp, index) => plus(temp, x1.der[index])))
  }
}

const minus = (x0, x1) => {
  if ((typeof x0 === "number") && (typeof x1 === "number") && !isNaN(x0) && !isNaN(x1)) {
    return x0 - x1;
  } else if ((x0.type === "valder") || (x1.type === "valder")) {
    if ((typeof x0 === "number") && (typeof x1 !== "number")) {
      x0 = valder(x0, x1.der.map(temp => 0));
    }

    if ((typeof x1 === "number") && (typeof x0 !== "number")) {
      x1 = valder(x1, x0.der.map(temp => 0));
    }

    return valder(minus(x0.val, x1.val), x0.der.map((temp, index) => minus(temp, x1.der[index])));
  }
}

const exp = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.exp(x);
  } else if (x.type === "valder") {
    return valder(exp(x.val), x.der.map(temp => mul(temp, exp(x.val))))
  }
}

const sqrt = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.sqrt(x);
  } else if (x.type === "valder") {
    return valder(sqrt(x.val), x.der.map(temp => mul(temp, div(0.5, sqrt(x.val)))))
  }
}

const log = (x) => {
  if ((typeof x === "number") && !isNaN(x)) {
    return Math.log(x);
  } else if (x.type === "valder") {
    return valder(log(x.val), x.der.map(temp => div(temp, x.val)))
  }
}

const power = (x0, x1) => {
  if ((typeof x0 === "number") && (typeof x1 === "number") && !isNaN(x0) && !isNaN(x1)) {
    return x0 ** x1
  } else if ((x0.type === "valder") || (x1.type === "valder")) {
    if ((typeof x0 === "number") && (typeof x1 !== "number")) {
      x0 = valder(x0, x1.der.map(temp => 0));
    }

    if ((typeof x1 === "number") && (typeof x0 !== "number")) {
      x1 = valder(x1, x0.der.map(temp => 0));
    }

    let ans;
    if (x1.val > 0) {
      ans = x0;
    } else if (x1.val < 0) {
      ans = div(1, x0);
    } else {
      return valder(0, x0.der.map(temp => 0)); //ToDO: should this be a valder, der maybe wrong
    }

    for (let step = 1; step < Math.abs(x1.val); step++) {
      ans = mul(ans, x0);
    }

    return ans;
  }
}

const squared = x => power(x, 2);

export {
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
  power,
  squared
};