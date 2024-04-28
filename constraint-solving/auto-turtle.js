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
} from "./autodiff.js";

const active = [];
const params = [];

const num = x => valder(x);

function param(x) {
  const n = num(x);
  params.push(n);
  return n;
}


let pradius = param(10)
let pangle = param(60)
let pscale = num(1.2)

function draw() {
  // turtle API
  let [mx,my,ma] = [num(75),num(75),num(-Math.PI)]
  active.push({x: mx, y: my })
  ctx.beginPath()
  ctx.moveTo(mx.val, my.val)
  function forward(n) {
    mx = plus(mx,times(sin(ma), n))
    my = plus(my,times(cos(ma), n))
    active.push({x: mx, y: my })
    ctx.lineTo(mx.val, my.val)
  }
  function turn(n) {
    ma = minus(ma, times(n, num(Math.PI/180)))
  }
  // turtle program: draw spiral
  let [r,a,s] = [pradius, pangle, pscale]
  for (let i = 0; i < 10; i++) {
    forward(r)
    turn(a)
    r = times(r, s)
  }
  // finish up
  ctx.stroke()
}

draw();