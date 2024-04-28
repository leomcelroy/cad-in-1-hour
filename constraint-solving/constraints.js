class Coincident { //this had multiple eqs
  constructor(p1, p2) {
    this.points = [p1, p2];
    this.name = "coincident";
    this.targets = [p1, p2];

    p2.id = p1.id;
    p2.coincident = true;
  }

  getEqs() {
    return [];
  } //TODO: write what it would be

}

class DistancePointLine {
  constructor(p, line, dist) {
    this.points = [p, line.pointList[0], line.pointList[1]];
    this.name = "coincidentLine";
    this.targets = [p, line];
    this.dist = dist;
  }

  getEqs() {
    let px = `x${this.points[0].id}`;
    let py = `y${this.points[0].id}`;

    let lp1x = `x${this.points[1].id}`;
    let lp1y = `y${this.points[1].id}`;

    let lp2x = `x${this.points[2].id}`;
    let lp2y = `y${this.points[2].id}`;

    let top = `sqrt(((${lp2y} - ${lp1y})*${px} - (${lp2x} - ${lp1x})*${py} + ${lp2x} * ${lp1y} - ${lp2y} * ${lp1x})**2)`
    let bottom = `sqrt((${lp2x}-${lp1x})**2+(${lp2y}-${lp1y})**2)`;

    return [`${top}/${bottom} - ${this.dist}`];
  }

}

class CoincidentArc {
  constructor(p, arc) {
    this.points = [p, arc.pointList[0], arc.pointList[1]];
    this.name = "coincidentArc";
    this.targets = [p, arc];
  }

  getEqs() {
    let px = `x${this.points[0].id}`;
    let py = `y${this.points[0].id}`;

    let acx = `x${this.points[1].id}`;
    let acy = `y${this.points[1].id}`;
    let ax = `x${this.points[2].id}`;
    let ay = `y${this.points[2].id}`;

    let dist = `sqrt((${acx}-${ax})**2+(${acy}-${ay})**2)`;
    let dist2 = `sqrt((${acx}-${px})**2+(${acy}-${py})**2)`;

    return [`${dist2} - ${dist}`];
  }

}

class SetX {
  constructor(p, x) {
    this.points = [p];
    this.name = "setX";
    this.x = x;
    this.targets = [p];
  }

  getEqs() {
    let px = `x${this.points[0].id}`;
    return [`${this.x} - ${px}`];
  }

}

class SetY {
  constructor(p, y) {
    this.points = [p];
    this.name = "setY";
    this.y = y;
    this.targets = [p];
  }

  getEqs() {
    let py = `y${this.points[0].id}`;
    return [`${this.y} - ${py}`];
  }
}

class Fixed {
  constructor(p, x, y) {
    this.points = [p];
    this.name = "fixed";
    this.x = x;
    this.y = y;
    this.targets = [p];
  }

  getEqs() {
    let px = `x${this.points[0].id}`;
    let py = `y${this.points[0].id}`;

    return [`${this.x} - ${px}`, `${this.y} - ${py}`];
  }
}

class Distance {
  constructor(p1, p2, dist) {
    this.points = [p1, p2]
    this.dist = dist;
    this.name = "distance";
    this.targets = [p1, p2];
  }

  getEqs() {
    let p1x = `x${this.points[0].id}`;
    let p1y = `y${this.points[0].id}`;
    let p2x = `x${this.points[1].id}`;
    let p2y = `y${this.points[1].id}`;
    let dist = this.dist;

    return [`${dist} - sqrt((${p2x}-${p1x})**2+(${p2y}-${p1y})**2)`];
  }
}

class Equal {
  constructor(line1, line2) {
    this.points = [line1.pointList[0], line1.pointList[1], line2.pointList[0], line2.pointList[1]];
    this.name = "equal";
    this.targets = [line1, line2];
  }

  getEqs() {
    let l1p1x = `x${this.points[0].id}`;
    let l1p1y = `y${this.points[0].id}`;

    let l1p2x = `x${this.points[1].id}`;
    let l1p2y = `y${this.points[1].id}`;

    let l2p1x = `x${this.points[2].id}`;
    let l2p1y = `y${this.points[2].id}`;

    let l2p2x = `x${this.points[3].id}`;
    let l2p2y = `y${this.points[3].id}`;

    let d1 = `sqrt((${l1p2x}-${l1p1x})**2+(${l1p2y}-${l1p1y})**2)`
    let d2 = `sqrt((${l2p2x}-${l2p1x})**2+(${l2p2y}-${l2p1y})**2)`

    return [`${d2} - ${d1}`];
  }
}


class Vertical {
  constructor(p1, p2) {
    this.points = [p1, p2]
    this.name = "vertical";
    this.targets = [p1, p2];
  }

  getEqs() {
    let p1x = `x${this.points[0].id}`;
    let p2x = `x${this.points[1].id}`;

    return [`${p2x}-${p1x}`];
  }
}

class Horizontal {
  constructor(p1, p2) {
    this.points = [p1, p2]
    this.name = "horizontal";
    this.targets = [p1, p2];
  }

  getEqs() {
    let p1y = `y${this.points[0].id}`;
    let p2y = `y${this.points[1].id}`;

    return [`${p2y}-${p1y}`];
  }
}

class Parallel { //this had multiple eqs
  constructor(line1, line2) {
    this.points = [line1.pointList[0], line1.pointList[1], line2.pointList[0], line2.pointList[1]];
    this.name = "parallel";
    this.targets = [line1, line2];
  }

  getEqs() {
    let l1p1x = `x${this.points[0].id}`;
    let l1p1y = `y${this.points[0].id}`;

    let l1p2x = `x${this.points[1].id}`;
    let l1p2y = `y${this.points[1].id}`;

    let l2p1x = `x${this.points[2].id}`;
    let l2p1y = `y${this.points[2].id}`;

    let l2p2x = `x${this.points[3].id}`;
    let l2p2y = `y${this.points[3].id}`;

    let top = `(-${l1p2x} + ${l1p1x}) * (${l2p2y} - ${l2p1y}) + (${l1p2y} - ${l1p1y}) * (${l2p2x} - ${l2p1x})`

    return [`${top}`];
  }

}

class Perpendicular { //this had multiple eqs
  constructor(line1, line2) {
    this.points = [line1.pointList[0], line1.pointList[1], line2.pointList[0], line2.pointList[1]];
    this.name = "perpendicular";
    this.targets = [line1, line2];
  }

  getEqs() {
    let l1p1x = `x${this.points[0].id}`;
    let l1p1y = `y${this.points[0].id}`;

    let l1p2x = `x${this.points[1].id}`;
    let l1p2y = `y${this.points[1].id}`;

    let l2p1x = `x${this.points[2].id}`;
    let l2p1y = `y${this.points[2].id}`;

    let l2p2x = `x${this.points[3].id}`;
    let l2p2y = `y${this.points[3].id}`;

    return [`(${l1p2x}-${l1p1x}) * (${l2p2x}-${l2p1x}) + (${l1p2y}-${l1p1y}) * (${l2p2y}-${l2p1y})`];
  }

}

class Angle { //this had multiple eqs
  constructor(line1, line2, angle) {
    this.points = [line1.pointList[0], line1.pointList[1], line2.pointList[0], line2.pointList[1]];
    this.name = "angle";
    this.angle = angle;
    this.targets = [line1, line2];
  }

  getEqs() {
    let l1p1x = `x${this.points[0].id}`;
    let l1p1y = `y${this.points[0].id}`;

    let l1p2x = `x${this.points[1].id}`;
    let l1p2y = `y${this.points[1].id}`;

    let l2p1x = `x${this.points[2].id}`;
    let l2p1y = `y${this.points[2].id}`;

    let l2p2x = `x${this.points[3].id}`;
    let l2p2y = `y${this.points[3].id}`;

    let r1 = Math.cos(Math.PI/180 * this.angle);
    let r2 = Math.sin(Math.PI/180 * this.angle);

    let dx1 = `(${l1p2x} - ${l1p1x})`
    let dy1 = `(${l1p2y} - ${l1p1y})`

    let dx3 = `(${dx1}*${r1} - ${dy1}*${r2})`;
    let dy3 = `(${dx1}*${r2} + ${dy1}*${r1})`;

    let dx2 = `(${l2p2x} - ${l2p1x})`
    let dy2 = `(${l2p2y} - ${l2p1y})`

    let d = `(${dx3}*${dx2} + ${dy3}*${dy2})`;   // dot product of the 2 vectors
    let l2 = `(sqrt(${dx3}**2+${dy3}**2)*sqrt(${dx2}**2+${dy2}**2))` // product of the squared lengths
    return [`${d}/${l2}`];
  }

}
export {
  CoincidentArc,
  DistancePointLine,
  Coincident,
  SetY,
  SetX,
  Distance,
  Vertical,
  Horizontal,
  Perpendicular,
  Angle,
  Parallel,
  Fixed,
  Equal
}