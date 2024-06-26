import { html, svg, render } from "../libs/lit-html.js"
import { createListener } from "../js/createListener.js";
import { solveSystem } from "../js/solveSystem.js";
import { compile, evaluate } from "../js/evaluate.js";

const HEAT_MAP_SIZE = 16;

export function initInteractiveConstraints(elId, ops = {}) {
  const showHeatmap = ops.showHeatmap ?? false;
  const pts = ops.pts ?? {};
  const constraints = ops.constraints ?? [];
  const fillMap = ops.fillMap ?? {};
  const lines = ops.lines ?? [];


  const targetEl = document.querySelector(elId);

  // STATE
  const STATE = {
    pts,
    constraints,
    fillMap,
    lines,
    steps: [],
    heatMap: [],
    showHeatmap
  }

  const view = (state) => {
    return html`
      <style>
        .constraint-container {
          width: 400px;
          max-width: 90%;
          aspect-ratio: 1;
          height: 400px;
        }

        .constraint-container svg {
          border: 1px solid black;
          border-radius: 4px;
        }
      </style>
      <div class="constraint-container" style="display: flex; flex-direction: column; gap: 10px;">
        <svg id="constraints" viewBox="-100 -100 200 200">
          ${state.heatMap.map(tile => drawHeatTile(tile))}
          ${state.steps.map(points => drawPoints(points))}
          ${state.lines.map(l => drawLine(l))}
          ${Object.entries(state.pts).map(drawPoint)}
        </svg>

        <div style="display: flex; gap: 10px; align-items: center;">
          <span>show gradient:</span>
          <input type="checkbox" .checked=${state.showHeatmap} @click=${(e) => { 
            state.showHeatmap = e.target.checked;
            if (state.showHeatmap === false) state.heatMap = [];
            else initHeatmap();
            state.r();
          }}/>
        </div>
      </div>
    `
  }

  const drawPoint = ([id, pt], index) => svg`<circle handle data-id=${id} cx=${pt.x} cy=${pt.y} r="5" fill=${STATE.fillMap[id]} stroke="#928e8e"/>`
  const drawLine = (points) => svg`<polyline stroke="grey" stroke-width="3" fill="none" points=${points.map(p => Object.values(STATE.pts[p]).join(",") ).join(" ")} />`

  function drawPoints(points) {
    return "";

    const circles = [];

    Object.entries(points).forEach(([ id, { x, y } ]) => {
      circles.push(svg`<circle cx=${x} cy=${y} r=".5" fill=${STATE.fillMap[id]}/>`)
    })

    const lines = [];
    return svg`
      ${circles}
    `
  }

  function drawHeatTile(tile) {
    const { x, y, val } = tile;

    // Convert val (0 to 1) into a color.
    // This example uses a simple red to blue gradient.
    // const color = `rgb(${Math.round(255 * val)}, 0, ${Math.round(255 * (1 - val))})`;
    const color = plasmaColor(val);
    return svg`
      <rect x="${x-HEAT_MAP_SIZE/2}" y="${y-HEAT_MAP_SIZE/2}" width=${HEAT_MAP_SIZE} height=${HEAT_MAP_SIZE} fill="${color}"></rect>
    `;
  }

  function plasmaColor(val) {
    const scale = ["#0d0887","#100788","#130789","#16078a","#19068c","#1b068d","#1d068e","#20068f","#220690","#240691","#260591","#280592","#2a0593","#2c0594","#2e0595","#2f0596","#310597","#330597","#350498","#370499","#38049a","#3a049a","#3c049b","#3e049c","#3f049c","#41049d","#43039e","#44039e","#46039f","#48039f","#4903a0","#4b03a1","#4c02a1","#4e02a2","#5002a2","#5102a3","#5302a3","#5502a4","#5601a4","#5801a4","#5901a5","#5b01a5","#5c01a6","#5e01a6","#6001a6","#6100a7","#6300a7","#6400a7","#6600a7","#6700a8","#6900a8","#6a00a8","#6c00a8","#6e00a8","#6f00a8","#7100a8","#7201a8","#7401a8","#7501a8","#7701a8","#7801a8","#7a02a8","#7b02a8","#7d03a8","#7e03a8","#8004a8","#8104a7","#8305a7","#8405a7","#8606a6","#8707a6","#8808a6","#8a09a5","#8b0aa5","#8d0ba5","#8e0ca4","#8f0da4","#910ea3","#920fa3","#9410a2","#9511a1","#9613a1","#9814a0","#99159f","#9a169f","#9c179e","#9d189d","#9e199d","#a01a9c","#a11b9b","#a21d9a","#a31e9a","#a51f99","#a62098","#a72197","#a82296","#aa2395","#ab2494","#ac2694","#ad2793","#ae2892","#b02991","#b12a90","#b22b8f","#b32c8e","#b42e8d","#b52f8c","#b6308b","#b7318a","#b83289","#ba3388","#bb3488","#bc3587","#bd3786","#be3885","#bf3984","#c03a83","#c13b82","#c23c81","#c33d80","#c43e7f","#c5407e","#c6417d","#c7427c","#c8437b","#c9447a","#ca457a","#cb4679","#cc4778","#cc4977","#cd4a76","#ce4b75","#cf4c74","#d04d73","#d14e72","#d24f71","#d35171","#d45270","#d5536f","#d5546e","#d6556d","#d7566c","#d8576b","#d9586a","#da5a6a","#da5b69","#db5c68","#dc5d67","#dd5e66","#de5f65","#de6164","#df6263","#e06363","#e16462","#e26561","#e26660","#e3685f","#e4695e","#e56a5d","#e56b5d","#e66c5c","#e76e5b","#e76f5a","#e87059","#e97158","#e97257","#ea7457","#eb7556","#eb7655","#ec7754","#ed7953","#ed7a52","#ee7b51","#ef7c51","#ef7e50","#f07f4f","#f0804e","#f1814d","#f1834c","#f2844b","#f3854b","#f3874a","#f48849","#f48948","#f58b47","#f58c46","#f68d45","#f68f44","#f79044","#f79143","#f79342","#f89441","#f89540","#f9973f","#f9983e","#f99a3e","#fa9b3d","#fa9c3c","#fa9e3b","#fb9f3a","#fba139","#fba238","#fca338","#fca537","#fca636","#fca835","#fca934","#fdab33","#fdac33","#fdae32","#fdaf31","#fdb130","#fdb22f","#fdb42f","#fdb52e","#feb72d","#feb82c","#feba2c","#febb2b","#febd2a","#febe2a","#fec029","#fdc229","#fdc328","#fdc527","#fdc627","#fdc827","#fdca26","#fdcb26","#fccd25","#fcce25","#fcd025","#fcd225","#fbd324","#fbd524","#fbd724","#fad824","#fada24","#f9dc24","#f9dd25","#f8df25","#f8e125","#f7e225","#f7e425","#f6e626","#f6e826","#f5e926","#f5eb27","#f4ed27","#f3ee27","#f3f027","#f2f227","#f1f426","#f1f525","#f0f724","#f0f921"];

    return scale[Math.round(val*(scale.length-1))];
  }

  const r = () => {
    render(view(STATE), targetEl);
  }

  STATE.r = r;

  if (STATE.showHeatmap) initHeatmap();

  function initHeatmap() {


    const constraints = STATE.constraints.map(x => x.eqs).flat();

    const initialVals = {};

    Object.entries(STATE.pts).forEach(([id, pt]) => {
      initialVals[`${id}_x`] = pt.x;
      initialVals[`${id}_y`] = pt.y;
    })

    const parseComb = eqs => {
      eqs = eqs.map(eq => `(${eq})*(${eq})`);
      return eqs.join("+");
    }

    const cost = parseComb(constraints);

    let heatMap = [];

    const testId = Object.keys(STATE.pts)[0];


    const test = JSON.parse(JSON.stringify(initialVals));
    const compiledFunc = compile(Object.keys(test), cost);

    // console.log({
    //   compiled: compiledFunc(...Object.values(test)),
    //   evaled: evaluate(cost, test)
    // })

    for (let i = -Math.floor(100/HEAT_MAP_SIZE); i < Math.floor(100/HEAT_MAP_SIZE)+1; i++) {
      for (let j = -Math.floor(100/HEAT_MAP_SIZE); j < Math.floor(100/HEAT_MAP_SIZE)+1; j++) {
        const x = i*HEAT_MAP_SIZE;
        const y = j*HEAT_MAP_SIZE;
        test[`${testId}_x`] = x;
        test[`${testId}_y`] = y;

        const { val, der } = compiledFunc(...Object.values(test));

        const xIndex = Object.keys(test).findIndex(x => x === `${testId}_x`);
        const yIndex = Object.keys(test).findIndex(x => x === `${testId}_y`);

        heatMap.push({ x, y, val: Math.sqrt(der[xIndex]**2 + der[yIndex]**2) });
      }
    }

    const maxHeatValue = Math.max(...heatMap.map(x => x.val));

    STATE.heatMap = heatMap.map(x => {
      x.val = x.val/maxHeatValue;

      return x;
    })
  
  }

  r();

  const listen = createListener(targetEl);
  addHandleControl(STATE, listen);

}

function addHandleControl(state, listen) {
  let draggingId = "";

  listen("pointerdown", "[handle]", e => {
    const id = e.target.dataset.id;
    draggingId = id;
  });

  listen("touchmove", "", e => {
    if (draggingId === "" && !e.target.matches("svg")) return

    e.preventDefault();
  })

  listen("pointermove", "", e => {
    if (draggingId === "") return

    e.preventDefault();

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

    if (state.showHeatmap) {


      const parseComb = eqs => {
        eqs = eqs.map(eq => `(${eq})*(${eq})`);
        return eqs.join("+");
      }

      const cost = parseComb(constraints);

      let heatMap = [];

      const test = JSON.parse(JSON.stringify(initialVals));
      const compiledFunc = compile(Object.keys(test), cost);

      for (let i = -Math.floor(100/HEAT_MAP_SIZE); i < Math.floor(100/HEAT_MAP_SIZE)+1; i++) {
        for (let j = -Math.floor(100/HEAT_MAP_SIZE); j < Math.floor(100/HEAT_MAP_SIZE)+1; j++) {
          const x = i*HEAT_MAP_SIZE;
          const y = j*HEAT_MAP_SIZE;
          test[`${draggingId}_x`] = x;
          test[`${draggingId}_y`] = y;

          const { val, der } = compiledFunc(...Object.values(test));

          const xIndex = Object.keys(test).findIndex(x => x === `${draggingId}_x`);
          const yIndex = Object.keys(test).findIndex(x => x === `${draggingId}_y`);

          heatMap.push({ x, y, val: Math.sqrt(der[xIndex]**2 + der[yIndex]**2) });
        }
      }

      const maxHeatValue = Math.max(...heatMap.map(x => x.val));

      state.heatMap = heatMap.map(x => {
        x.val = x.val/maxHeatValue;

        return x;
      })
    }


    let satisfied = [];
    let solutions = initialVals;
    let points = [varsToPts(solutions)];

    // console.log({
    //   heatMap,
    //   constraints,
    //   cost,
    //   initialVals,
    //   draggingId 
    // })

    let steps = 0;
    let MAX_STEPS = 10000;
    while (satisfied.some(s => !s) && steps < MAX_STEPS || steps === 0) {
      const result = solveSystem(
        constraints, 
        solutions, 
        { 
          // maxSteps: 1
        }
      );

      satisfied = result[0];
      solutions = result[1];

      // points.push(varsToPts(solutions));

      steps++;
    };

    if (steps === MAX_STEPS) console.log("max stepped");


    state.pts = varsToPts(solutions);
    state.steps = points;
    
    function varsToPts(vars) {
      let newPts = {};
      Object.entries(vars).forEach(([id, val]) => {
        const [ptId, xy] = id.split("_");
        if (!(ptId in newPts)) newPts[ptId] = { x: 0, y: 0 }
        newPts[ptId][xy] = val;
      })

      return newPts;
    }


    state.r();
  });

  listen("pointerup", "", e => {
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
















