import { html, svg, render } from "../libs/lit-html.js";
import { createListener } from "../js/createListener.js";

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

export function init2DFREP(
  elId, 
  { 
    showGrid = false, 
    showShape = true,
    showField = false,
    sdfFuncString = ""
  } = {}
) {

  sdfFuncString = unindent`${sdfFuncString}`;

  let sdfFunc;
  if (sdfFuncString === "") {
    sdfFunc = (x, y) => {
      let rect = rectangleSDF(1.2, .2);
      let circle = circleSDF(.5);
      // circle = translate(circle, .2, .2);
      let final = union(rect, circle);

      return final(x, y);
    }
  } else {
    const include = `
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
    

    `
    sdfFunc = new Function("x", "y", include + sdfFuncString);
  }

  const state = {
    RESOLUTION: 0,
    SHOW_GRID: showGrid,
    SHOW_SHAPE: showShape,
    SHOW_FIELD: showField,
    sdfFunc: sdfFunc
  }

  const el = document.querySelector(elId);
  const r = () => render(html`
    <div style="display: flex; flex-direction: column; gap: .7rem;">
      <div style="display: flex; gap: 10px;">
        <pre id="editor" contenteditable spellcheck="false" style="max-height: 400px; overflow: auto; max-width: 350px; background: #f3f3f3; padding: 10px; height: 100%; width: 350px; font-family: monospace; border: 1px solid black; border-radius: 5px;">${sdfFuncString}</pre>
        <canvas style="border-radius: 5px; border: 1px solid black;"></canvas>
      </div>
      <div style="width: 100%; display: flex; justify-content: space-around;">
        <button style="padding: 5px;" @click=${() => {
          el.querySelector("#editor").innerText = sdfFuncString;
          wrapNumbersInSpans(editor)
          editor.querySelectorAll(".number").forEach(n => n.classList.add("editable-number"));
          const code = editor.innerText;
          state.sdfFunc = makeSDFFunc(code);
          renderCanvas();
        }}>reset</button>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span>resolution</span>
          <input type="range" .value=${state.RESOLUTION} min="0" max="100" step="1" @input=${(e) => {
            state.RESOLUTION = Number(e.target.value);
            renderCanvas();
          }}/>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span>show grid:</span>
          <input type="checkbox" .checked=${state.SHOW_GRID} @click=${(e) => { 
            state.SHOW_GRID = e.target.checked;
            renderCanvas();
          }}/>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span>show shape:</span>
          <input type="checkbox" .checked=${state.SHOW_SHAPE} @click=${(e) => { 
            state.SHOW_SHAPE = e.target.checked;
            renderCanvas();
          }}/>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span>show field:</span>
          <input type="checkbox" .checked=${state.SHOW_FIELD} @click=${(e) => { 
            state.SHOW_FIELD = e.target.checked;
            renderCanvas();
          }}/>
        </div>
      </div>
    </div>
  `, el);

  r();

  const editor = el.querySelector("#editor");

  editor.addEventListener("focus", e => {
    // editor.querySelectorAll(".number").forEach(n => n.classList.remove("editable-number"));
  });

  editor.addEventListener("blur", e => {
    wrapNumbersInSpans(editor)
    editor.querySelectorAll(".number").forEach(n => n.classList.add("editable-number"));
    const code = editor.innerText;
    state.sdfFunc = makeSDFFunc(code);
    renderCanvas();
  });


  wrapNumbersInSpans(editor)
  editor.querySelectorAll(".number").forEach(n => n.classList.add("editable-number"));

  addNumberScrubbing(document.body, () => {
    const code = editor.innerText;
    state.sdfFunc = makeSDFFunc(code);
    renderCanvas();
  })

  const canvas = el.querySelector("canvas");
  canvas.width = 400;
  canvas.height = 400;

  const renderCanvas = () => {
    renderSDF(canvas, state.sdfFunc);
  }

  renderSDF(canvas, state.sdfFunc);

  // Renderer function
  function renderSDF(canvas, sdfFunc) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

     if (state.SHOW_SHAPE) 
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

      if (state.SHOW_FIELD) drawLevelSets(ctx, width, height, sdfFunc)

      if (state.RESOLUTION > 0) 
        for (let y = 0; y < state.RESOLUTION; y++) {
            for (let x = 0; x < state.RESOLUTION; x++) {
                // Normalize the coordinates to [-1, 1]
                const nx = ((x / state.RESOLUTION) * 2 - 1) + 1/state.RESOLUTION;
                const ny = ((y / state.RESOLUTION) * 2 - 1) + 1/state.RESOLUTION;

                // Determine the color based on the signed distance
                const inside = sdfFunc(nx, -ny) < 0;
                ctx.fillStyle = '#ff000090'
                const cellSize = Math.min(width, height) / state.RESOLUTION;
                if (inside)  ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
            }
        }

      if (state.SHOW_GRID) drawSquareGrid(canvas, state.RESOLUTION, "lightblue");

  }
}

function drawSquareGrid(canvas, resolution, gridColor) {
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

function wrapNumbersInSpans(div) {
  removeAllSpansAndReplaceWithInnerText(div);
    const regex = /-?((\d+(\.\d+)?)|(\.\d+))/g; // Regex to find valid JS numbers including negative and decimals

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) { // Process only text nodes
            let text = node.textContent;
            let parent = node.parentNode;

            // Skip if the parent node is already a 'span'
            if (parent.tagName === 'SPAN') {
                return;
            }

            let matches, lastIdx = 0;
            const frag = document.createDocumentFragment();

            while ((matches = regex.exec(text)) !== null) {
                const match = matches[0];
                const idx = matches.index;

                // Add previous text if any
                if (idx > lastIdx) {
                    frag.appendChild(document.createTextNode(text.substring(lastIdx, idx)));
                }

                // Create a span for the matched number
                const span = document.createElement('span');
                span.classList.add("number");
                span.textContent = match;
                frag.appendChild(span);

                lastIdx = idx + match.length;
            }

            // Add any remaining text after the last match
            if (lastIdx < text.length) {
                frag.appendChild(document.createTextNode(text.substring(lastIdx)));
            }

            // Replace the original text node with the new content
            parent.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) { // Recurse into element nodes
            Array.from(node.childNodes).forEach(processNode);
        }
    }

    // Start processing from the provided div
    processNode(div);
}

function drawLevelSets(ctx, width, height, sdfFunc) {
    const levelSetInterval = 0.05; // Distance between level sets
    const epsilon = 0.008; // Tolerance for level set detection

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Normalize the coordinates to [-1, 1]
            const nx = (x / width) * 2 - 1;
            const ny = (y / height) * 2 - 1;

            // Determine the signed distance
            const dist = sdfFunc(nx, -ny); // Assuming sdfFunc is defined to take normalized coords

            // Color based on distance field
            ctx.fillStyle = getColorFromDistance(dist);

            // Check if the current point is close to a level set
            if (Math.abs(dist % levelSetInterval) < epsilon || Math.abs(dist % levelSetInterval - levelSetInterval) < epsilon) {
                ctx.fillStyle = "black"; // Draw level sets in black
            }

            if (Math.abs(dist) < 0.004) {
              ctx.fillStyle = "white";
            }

            ctx.fillRect(x, y, 1, 1);
        }
    }
}

function getColorFromDistance(distance) {
    // Base colors defined for inside and outside
    const baseColorInside = { r: 167, g: 119, b: 45 }; // #a7772d
    const baseColorOutside = { r: 28, g: 28, b: 123 }; // #1c1c7b


    if (distance < 0) {
          // Calculate intensity based on the distance; farther means lighter
    const maxDistanceForColor = .15; // Adjust as needed for the range of your SDF
    const intensity = Math.min(Math.abs(distance) / maxDistanceForColor, 1);
    const factor = 200 * (1 - intensity); // Lightening factor

        // Calculate new RGB values for inside color lightening towards white
        const r = Math.floor(baseColorInside.r + factor * (255 - baseColorInside.r) / 255);
        const g = Math.floor(baseColorInside.g + factor * (255 - baseColorInside.g) / 255);
        const b = Math.floor(baseColorInside.b + factor * (255 - baseColorInside.b) / 255);
        return `rgb(${r}, ${g}, ${b})`;
    } else {
          // Calculate intensity based on the distance; farther means lighter
    const maxDistanceForColor = .6; // Adjust as needed for the range of your SDF
    const intensity = Math.min(Math.abs(distance) / maxDistanceForColor, 1);
    const factor = 150 * (1 - intensity); // Lightening factor

        // Calculate new RGB values for outside color lightening towards white
        const r = Math.floor(baseColorOutside.r + factor * (255 - baseColorOutside.r) / 255);
        const g = Math.floor(baseColorOutside.g + factor * (255 - baseColorOutside.g) / 255);
        const b = Math.floor(baseColorOutside.b + factor * (255 - baseColorOutside.b) / 255);
        return `rgb(${r}, ${g}, ${b})`;
    }
}
// function getColorFromDistance(distance) {
//     // This function can be customized to return different colors based on the distance
//     if (distance < 0) {
//         return '#a7772d'; // Inside the shape
//     } else if (distance > 0) {
//         return '#1c1c7b'; // Outside the shape
//     } else {
//         return 'black'; // Exactly on the surface
//     }
// }

function unindent(strings, ...values) {
    // Merge strings and values into one string
    let fullString = strings.reduce((accumulator, str, i) => {
        return accumulator + str + (values[i] || '');
    }, '');

    // Split the result into lines
    let lines = fullString.split('\n');

    // Remove leading and trailing empty lines
    if (lines[0].trim() === '') {
        lines.shift();
    }
    if (lines[lines.length - 1].trim() === '') {
        lines.pop();
    }

    // Find the minimum indentation
    const minIndent = lines.reduce((min, line) => {
        const currentIndent = line.match(/^\s*/)[0].length;
        return line.trim() === '' ? min : Math.min(min, currentIndent);
    }, Infinity);

    // Remove the common leading indentation
    const unindentedLines = lines.map(line => 
        line.slice(minIndent)
    );

    // Join the lines back into a single string
    return unindentedLines.join('\n');
}

function addNumberScrubbing(el, run = null) {
  const listen = createListener(el)

  let dragging = false
  let number = 0
  let sigFigs = 0
  let numEl = null;

  listen('mousedown', '', e => {
    const el = e.target.closest('.editable-number')
    if (el === null) return

    dragging = true

    const numStr = el.innerText;

    number = Number(numStr)
    sigFigs = numStr.split('.')[1]?.length ?? 0
    numEl = el;
  })

  listen('mousemove', '', e => {
    if (dragging === false) return
    if (e.buttons === 0) {
      dragging = false
      return
    }

    e.preventDefault()
    e.stopPropagation()

    document.body.style.cursor = 'ew-resize'

    number += sigFigs ? e.movementX * 10 ** (-1 * sigFigs) : e.movementX
    const newValue = number.toFixed(sigFigs)

    numEl.innerText = newValue;

    if (run) run();
  })

  listen('mouseup', '', e => {
    if (dragging) document.activeElement.blur();

    dragging = false
    document.body.style.cursor = 'default'
  })
}

function makeSDFFunc(str) {
    const include = `
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
    

    `
    return new Function("x", "y", include + str);
}

function removeAllSpansAndReplaceWithInnerText(container) {
    const spans = container.getElementsByTagName('span');

    // Convert the HTMLCollection to an array for safe iteration
    // because HTMLCollection is live, modifying it during iteration can lead to issues
    Array.from(spans).forEach(span => {
        // Replace each span with its inner text
        const textNode = document.createTextNode(span.textContent);
        span.parentNode.replaceChild(textNode, span);
    });
}
