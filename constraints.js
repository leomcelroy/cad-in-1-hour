import { html, svg, render } from "./libs/lit-html.js"
import { createListener } from "./createListener.js";
import { solveSystem } from "./constraint-solving/solveSystem.js";

function initInteractiveConstraints(targetEl) {

  // STATE
  const STATE = {
    pts: {
      "a": { x: 50, y: 50 },
      "b": { x: 0,  y: 50 },
      "c": { x: 0,  y: 50 }
    },
    constraints: [
      createDistanceConstraint("a", "b", 30),
      createDistanceConstraint("b", "c", 20),
      {
        eqs: [`50 - a_x`, `c_y - a_y`, `20 - a_y`, `c_x - b_x`]
      } 
    ]
  }

  const view = (state) => {
    return html`
      <style>
        #constraints {
          width: 400px;
          height: 400px;
          border: 1px solid black;
        }
      </style>
      <svg id="contraints" viewBox="0 0 100 100">
        ${Object.entries(state.pts).map(drawPoint)}
      </svg>
    `
  }

  const drawPoint = ([id, pt], index) => svg`<circle handle data-id=${id} cx=${pt.x} cy=${pt.y} r="5" />`

  const r = () => {
    render(view(STATE), targetEl);
  }

  STATE.r = r;

  r();

  const listen = createListener(targetEl);
  addHandleControl(STATE, listen);

}

const targetContainer = document.querySelector("#constraints");
initInteractiveConstraints(targetContainer);


function addHandleControl(state, listen) {
  let draggingId = "";

  listen("mousedown", "[handle]", e => {
    const id = e.target.dataset.id;
    draggingId = id;
  });

  listen("mousemove", "", e => {
    if (draggingId === "") return

    const svg = e.target.closest("svg");
    if (!svg) return;

    const targetPt = getTransformedCoordinates(e, svg);

    state.pts[draggingId].x = targetPt.x;
    state.pts[draggingId].y = targetPt.y;

    const constraints = state.constraints.map(x => x.eqs).flat();

    const initialVals = {};

    Object.entries(state.pts).forEach(([id, pt]) => {
      initialVals[`${id}_x`] = pt.x;
      initialVals[`${id}_y`] = pt.y;
    })

    const [ satisfied, solutions ] = solveSystem(constraints, initialVals);

    Object.entries(solutions).forEach(([id, val]) => {
      const [ptId, xy] = id.split("_");
      state.pts[ptId][xy] = val;
    })

    state.r();
  });

  listen("mouseup", "", e => {
    if (draggingId === "") return

    const id = e.target.dataset.id;
    draggingId = "";
  });
}

function getTransformedCoordinates(event, svg) {
  let pt = svg.createSVGPoint();

  // Pass event coordinates to the point
  pt.x = event.clientX;
  pt.y = event.clientY;

  // Transform the point into the SVG coordinate system
  let svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());

  return { x: svgPoint.x, y: svgPoint.y };
}


function createDistanceConstraint(p0, p1, dist) {
  const p0x = `${p0}_x`;
  const p1x = `${p1}_x`;
  const p0y = `${p0}_y`;
  const p1y = `${p1}_y`;

  return {
    name: "distance",
    points: [p0, p1],
    dist: dist,
    eqs: [`${dist} - sqrt((${p1x}-${p0x})^2+(${p1y}-${p0y})^2)`]
  }
}

















