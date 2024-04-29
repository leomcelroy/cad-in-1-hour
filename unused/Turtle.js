
export class Turtle {
  constructor(canvas) {
    this.drawing = true;
    this.location = { x: 0, y: 0 };
    this.angle = 0;
    this.size = 1;
    this.color = "black";
    this.strokeType = "round";

    this._fillArray = [];
    this._ctx = canvas.getContext("2d");

    this._ctx.lineCap = "round";
  }

  up() {
    this.drawing = false;

    return this;
  }

  down() {
    this.drawing = true;

    return this;
  }

  setStrokeType(type) { // round | flat
    this.strokeType = type;

    return this;
  }

  goto(x, y) {
    
    if (this.drawing) {
      this._ctx.lineWidth = this.size === 0 ? 0.000000001 : this.size;
      this._ctx.strokeStyle = this.color;
      this._ctx.fillStyle = this.color; 
      
      this._ctx.beginPath();
      this._ctx.moveTo(this.location.x, this.location.y)
      this._ctx.lineTo(x, y);
      this._ctx.stroke();
    }


    this.location = { x, y };
    if (this.drawing) this._fillArray.push(this.location);
    
    return this;
  }

  startFill() {
    this._fillArray = this.drawing ? [this.location] : [];

    return this;
  }

  endFill() {
    if (this._fillArray.length <= 1) return

    const c = this._ctx;
    c.fillStyle = this.color; 
    c.beginPath();
    const [first, ...rest] = this._fillArray;

    c.moveTo(first.x, first.y);
    rest.forEach(p => c.lineTo(p.x, p.y));
    c.fill();

    return this;
  }

  forward(distance) {
    const last = this.location;
    const a = this.angle/180 * Math.PI;
    const x = last.x + distance * Math.cos(a);
    const y = last.y + distance * Math.sin(a);

    this.goto(x, y);

    return this;
  }

  arc(angle, radius) {
    const theta = Math.abs(angle);
    
    const length = radius*theta/180*Math.PI;

    const ogAngle = this.angle;
    const thetaStep = 1;
    const steps = theta/thetaStep;
    const distanceStep = length/steps;

    for (let i = 0; i < steps; i++) {
      if (angle >= 0) this.right(thetaStep);
      else this.left(thetaStep);

      this.forward(distanceStep);
    }

    this.setAngle(ogAngle + angle);

    return this;
  }

  setAngle(theta) {
    this.angle = theta;

    return this;
  }

  right(theta) {
    this.angle += theta;

    return this;
  }

  left(theta) {
    this.angle -= theta;

    return this;
  }

  setSize(newSize) {
    this.size = newSize >= 0 ? newSize : 0;

    return this;
  }

  setColor(newColor) {
    this.color = newColor;
    
    return this;
  }

  drawTurtle() {

    const startX = this.location.x;
    const startY = this.location.y;

    this._ctx.save();
    this._ctx.fillStyle = "green";
    this._ctx.strokeStyle = "black";
    this._ctx.lineWidth = 1;

    this._ctx.translate(startX, startY);
    this._ctx.rotate((this.angle-90)*Math.PI/180);
    this._ctx.translate(-startX, -startY)

    this._ctx.beginPath()
    this._ctx.moveTo(startX, startY);
    this._ctx.lineTo(startX - 5, startY - 15)
    this._ctx.lineTo(startX + 5, startY - 15)
    this._ctx.lineTo(startX, startY)
    this._ctx.stroke()
    this._ctx.closePath()


    this._ctx.fill();

    this._ctx.restore();
  }

  
}