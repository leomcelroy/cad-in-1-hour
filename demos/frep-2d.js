const RESOLUTION = 30;
const SHOW_GRID = true;
// add option to show field
// add option to type in sdfs
// slider for inputs

// Example SDF function for a circle
const circleSDF = (radius) => (x, y) => {
    return Math.sqrt(x**2 + y**2) - radius**2;
}

const rectangleSDF = (w, h) => (x, y) => {
  const dx = Math.abs(x) - w / 2;
  const dy = Math.abs(y) - h / 2;

  const outsideDistance = Math.sqrt(Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2);
  const insideDistance = Math.min(Math.max(dx, dy), 0);

  return outsideDistance + insideDistance;
}

const translate = (sdf, dx, dy) => {
    return (x, y) => sdf(x-dx, y-dy);
}

const rotate = (sdf, angle) => {
    // return (x, y) => sdf(x-dx, y+dy);
}

const scale = (sdf, sx, sy) => {
    // return (x, y) => sdf(x-dx, y+dy);
}

const union = (sdf1, sdf2) => (x, y) => Math.min(sdf1(x, y), sdf2(x, y));
const intersection = (sdf1, sdf2) => (x, y) => Math.max(sdf1(x, y), sdf2(x, y));
const difference = (sdf1, sdf2) => (x, y) => Math.max(sdf1(x, y), -sdf2(x, y));

// Renderer function
function renderSDF(canvasId, sdfFunc) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Normalize the coordinates to [-1, 1]
            const nx = ((x / width) * 2 - 1);
            const ny = ((y / height) * 2 - 1);

            // Determine the color based on the signed distance
            const inside = sdfFunc(nx, -ny) < 0;
            ctx.fillStyle = 'white'
            if (inside) ctx.fillRect(x, y, 1, 1);
        }
    }

    if (RESOLUTION > 0) 
      for (let y = 0; y < RESOLUTION; y++) {
          for (let x = 0; x < RESOLUTION; x++) {
              // Normalize the coordinates to [-1, 1]
              const nx = ((x / RESOLUTION) * 2 - 1) + 1/RESOLUTION;
              const ny = ((y / RESOLUTION) * 2 - 1) + 1/RESOLUTION;

              // Determine the color based on the signed distance
              const inside = sdfFunc(nx, -ny) < 0;
              ctx.fillStyle = '#ff000090'
              const cellSize = Math.min(width, height) / RESOLUTION;
              if (inside)  ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
          }
      }

    if (SHOW_GRID) drawSquareGrid(canvasId, RESOLUTION, "lightblue");

}

// Call the renderer with the circle SDF
document.addEventListener('DOMContentLoaded', () => {
    renderSDF('sdfCanvas', (x, y) => {
      let rect = rectangleSDF(1.2, .2);
      let circle = circleSDF(.5);
      // circle = translate(circle, .2, .2);
      let final = union(rect, circle);

      return final(x, y);
    });
});

function drawSquareGrid(canvasId, resolution, gridColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
      console.error('Canvas element not found');
      return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Calculate grid size based on the resolution
  const cellSize = Math.min(width, height) / resolution;

  ctx.beginPath();
  ctx.strokeStyle = gridColor;

  // Draw vertical lines
  for (let x = 0; x <= width; x += cellSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += cellSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
  }

  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function init2DFREP(el) {
  const canvas = document.createElement("canvas");
}
