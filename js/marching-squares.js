const ISO_VALUE = .5;

function interpolate(side, neighbors, step) {
  let y0, y1;
  if (side === 0) {
    y0 = neighbors[0];
    y1 = neighbors[1];
  } else if (side === 1) {
    y0 = neighbors[1];
    y1 = neighbors[2];
  } else if (side === 2) {
    y0 = neighbors[3];
    y1 = neighbors[2];
  } else if (side === 3) {
    y0 = neighbors[3];
    y1 = neighbors[0];
  }

  let x0 = -1;
  let x1 = 1;
  let m = (y1 - y0) / (x1 - x0)
  let b = y1 - m * x1;
  let pointFiveX = (ISO_VALUE - b) / m;
  return step * pointFiveX
}

const RULES_INTERPOLATED = {
  "0000": ([x, y], step, neighbors) => [],
  "0001": ([x, y], step, neighbors) => [ // down
    [
      [x - step, y - interpolate(3, neighbors, step)],
      [x + interpolate(2, neighbors, step), y + step]
    ]
  ],
  "0010": ([x, y], step, neighbors) => [ // right
    [
      [x + interpolate(2, neighbors, step), y + step],
      [x + step, y + interpolate(1, neighbors, step)]
    ]
  ],
  "0100": ([x, y], step, neighbors) => [ // up
    [
      [x + step, y + interpolate(1, neighbors, step)],
      [x + interpolate(0, neighbors, step), y - step]
    ]
  ],
  "1000": ([x, y], step, neighbors) => [ // left
    [
      [x + interpolate(0, neighbors, step), y - step],
      [x - step, y - interpolate(3, neighbors, step)]
    ]
  ],
  "0011": ([x, y], step, neighbors) => [ // right
    [
      [x - step, y - interpolate(3, neighbors, step)],
      [x + step, y + interpolate(1, neighbors, step)]
    ]
  ],
  "0101": ([x, y], step, neighbors) => [ // sweep
    [
      [x - step, y - interpolate(3, neighbors, step)],
      [x + interpolate(0, neighbors, step), y - step]
    ],
    [
      [x + step, y + interpolate(1, neighbors, step)],
      [x + interpolate(2, neighbors, step), y + step]
    ]
  ],
  "1001": ([x, y], step, neighbors) => [ // down
    [
      [x + interpolate(0, neighbors, step), y - step],
      [x + interpolate(2, neighbors, step), y + step]
    ]
  ],
  "0110": ([x, y], step, neighbors) => [ // up
    [
      [x + interpolate(2, neighbors, step), y + step],
      [x + interpolate(0, neighbors, step), y - step]
    ]
  ],
  "1010": ([x, y], step, neighbors) => [ // sweep
    [
      [x + interpolate(2, neighbors, step), y + step],
      [x - step, y - interpolate(3, neighbors, step)]
    ],
    [
      [x + interpolate(0, neighbors, step), y - step],
      [x + step, y + interpolate(1, neighbors, step)]
    ]
  ],
  "1100": ([x, y], step, neighbors) => [ // left
    [
      [x + step, y + interpolate(1, neighbors, step)],
      [x - step, y - interpolate(3, neighbors, step)]
    ]
  ],
  "0111": ([x, y], step, neighbors) => [ // up
    [
      [x - step, y - interpolate(3, neighbors, step)],
      [x + interpolate(0, neighbors, step), y - step]
    ]
  ],
  "1011": ([x, y], step, neighbors) => [ // right
    [
      [x + interpolate(0, neighbors, step), y - step],
      [x + step, y + interpolate(1, neighbors, step)]
    ]
  ],
  "1110": ([x, y], step, neighbors) => [ // left
    [
      [x + interpolate(2, neighbors, step), y + step],
      [x - step, y - interpolate(3, neighbors, step)]
    ]
  ],
  "1101": ([x, y], step, neighbors) => [ // down
    [
      [x + step, y + interpolate(1, neighbors, step)],
      [x + interpolate(2, neighbors, step), y + step]
    ]
  ],
  "1111": ([x, y], step, neighbors) => [],
}

const DIRECTION = {
  "0000": undefined,
  "0001": "down",
  "0010": "right",
  "0100": "up",
  "1000": "left",
  "0011": "right",
  "0101": undefined,
  "1001": "down",
  "0110": "up",
  "1010": undefined,
  "1100": "left",
  "0111": "up",
  "1011": "right",
  "1110": "left",
  "1101": "down",
  "1111": undefined,
}

export function marchImage( imgData ) {
  let {
    data: og,
    width: w,
    height: h
  } = imgData;

  const getGrey = (row, col) => og[((row * w) + col) * 4 + 3] / 255;

  const getNeighbors = (row, col) => [
    getGrey(row - 1, col - 1),
    getGrey(row - 1, col),
    getGrey(row, col),
    getGrey(row, col - 1),
  ]

  const getCode = neighbors => neighbors.map(x => x >= ISO_VALUE ? 1 : 0).join("");

  const allLines = [];
  const seen = {};

  let last = [];

  for (let y = 1; y < h; y++) {
    for (let x = 1; x < w; x++) {
      if (seen[`${x},${y}`]) continue;
      let neighbors = getNeighbors(y, x);
      let string = getCode(neighbors);
      let rule = RULES_INTERPOLATED[string];
      let direction = DIRECTION[string];
      const lines = rule([x, y], .5, neighbors);
      seen[`${x},${y}`] = true;
      let newPoints = lines.flat();
      if (newPoints.length > 0) allLines.push(lines.flat())
      if (direction) {
        let last = [x, y];
        while (direction) {
          if (direction === "up") y -= 1;
          else if (direction === "down") y += 1;
          else if (direction === "right") x += 1;
          else if (direction === "left") x -= 1;
          if (seen[`${x},${y}`] === true) break;
          neighbors = getNeighbors(y, x);
          string = getCode(neighbors);
          rule = RULES_INTERPOLATED[string];
          direction = DIRECTION[string];
          seen[`${x},${y}`] = true;
          let lines = rule([x, y], .5, neighbors);
          let lastPolyLine = allLines[allLines.length - 1];
          lines.forEach(l => {
            lastPolyLine.push(l[1]);
          });
        }
        [x, y] = last;
      }
    }
  }
  return allLines
}