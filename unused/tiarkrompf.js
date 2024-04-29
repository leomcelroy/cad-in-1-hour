// basic drawing code
let cvs = document.createElement("canvas")
cvs.width = 300
cvs.height = 150
let ctx = cvs.getContext("2d")
o.appendChild(cvs)
function drawRect(x,y,w,h) {
  ctx.fillRect(x.val, y.val, w.val, h.val)
}

function drawActive() {
  ctx.strokeStyle = "#aaaaaa"
  ctx.lineWidth = 2
  for (let {x,y} of active) {
    ctx.beginPath()
    ctx.arc(x.val, y.val, 5, 0, 2*Math.PI)
    ctx.stroke()
  }
  ctx.strokeStyle = "black"
}
function drawAll() {
  tape = []
  active = []
  ctx.clearRect(0,0,300,150)
  draw()
  drawActive()
}

function findActivePoint(offsetX,offsetY) {
  for (let i in active) {
    let {x,y} = active[i]
    const dx = x.val - offsetX
    const dy = y.val - offsetY
    if (Math.sqrt(dx*dx + dy*dy) < 5)
      return i
  }
  return -1
}
function dragActivePoint(dragging,offsetX,offsetY) {
  for (let i = 0; i<200; i++){
    let {x,y} = active[dragging]
    x.grad += offsetX - x.val
    y.grad += offsetY - y.val
    optimize()
    drawAll()
  }
}
lr = 0.01
function optimize() {
  // backprop
  for (b of tape.reverse()) b()
  tape = []
  // gradient descent
  let totaldiff = 0
  for (let p of params) {
    totaldiff += p.grad*p.grad
    p.val += lr * p.grad
    p.grad = 0
  }
}
cvs.addEventListener("mousedown", ev => {
  let dragging = findActivePoint(ev.offsetX, ev.offsetY)
  if (dragging >= 0) {
    let drag = ev => dragActivePoint(dragging,ev.offsetX,ev.offsetY)
    document.addEventListener("mousemove", drag)
    document.addEventListener("mouseup", ev => {
      document.removeEventListener("mousemove", drag)
    })
  }
})