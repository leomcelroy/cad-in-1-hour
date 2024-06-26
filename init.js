import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm'
import { initInteractiveConstraints } from "./demos/constraints.js";
import { init2DFREP } from "./demos/frep-2d.js";
import { initGraphDecompositions } from "./demos/constructive-solver.js";

document.getElementById('hamburger').addEventListener('click', function() {
  var toc = document.getElementById('table-of-content');
  if (toc.style.display === 'flex') {
    toc.style.display = 'none';
  } else {
    toc.style.display = 'flex';
  }
});

const renderer = new marked.Renderer();

renderer.code = (code, infostring, escaped) => {
  const highlighted = infostring === "js"
    ? hljs.highlight(code, { language: infostring }).value
    : code;
  return `<pre><code>${highlighted}</code></pre>`;
};

marked.setOptions({
  renderer
});

const pages = {
  "": async () => {
    const rawMarkdown = await fetch("./home.md").then(res => res.text());
    const html = marked(rawMarkdown);
    document.querySelector("main").innerHTML = html;
  },
  "frep": async () => {
    const rawMarkdown = await fetch("./frep.md").then(res => res.text());
    const html = marked(rawMarkdown);
    document.querySelector("main").innerHTML = html;

    init2DFREP("#frep", {
      sdfFuncString: `
        let mySDF = circle(.5)
        
        return mySDF(x, y)
      `,
      resolution: 40,
      showGrid: true,
      showShape: false,
    });

    init2DFREP("#frep-trans", {
      sdfFuncString: `
        let mySDF = circle(.5)
        
        return mySDF(x + 0.41, y - 0.32)
      `,
      // resolution: 40,
      // showGrid: true,
      showShape: true,
    });

    init2DFREP("#frep-trans-func", {
      sdfFuncString: `
        let mySDF = circle(.5)
        mySDF = translate(mySDF, .5, .5)
        
        return mySDF(x, y);
      `,
      // resolution: 40,
      // showGrid: true,
      showShape: true,
    });

    init2DFREP("#frep-union", {
      sdfFuncString: `
          let myRect = rectangle(1.2, 0.2)
          let myCircle = circle(.54)
          let final = union(myRect, myCircle)

          return final(x, y);

      `
    });

    init2DFREP("#frep-difference", {
      sdfFuncString: `
          let myRect = rectangle(1.2, 0.2)
          let myCircle = circle(.54)
          let final = difference(myRect, myCircle)

          return final(x, y);

      `
    });

    init2DFREP("#frep-intersection", {
      sdfFuncString: `
          let myRect = rectangle(1.2, 0.2)
          let myCircle = circle(.54)
          let final = intersection(myRect, myCircle)

          return final(x, y);

      `
    });

    init2DFREP("#frep-smooth", {
      sdfFuncString: `
          let rect = rectangle(1.2, 0.2)
          let cir = circle(.54)
          let final = smoothMin(rect, cir, .5)

          return final(x, y);

      `
    });


    init2DFREP("#frep-cat",{
      sdfFuncString: `
          let {hypot,abs,min,max,sqrt,sign} = Math;
          function box(px, py, bx, by) {
            let dx = abs(px) - bx;
            let dy = abs(py) - by;
            return hypot(max(dx, 0), max(dy, 0)) + min(max(dx, dy), 0.0);
          }
          function trig(px, py, r) {
            let k = sqrt(3.0);
            px = abs(px) - r;
            py = py + r / k;
            if (px + k * py > 0.0)[px, py] = [(px - k * py) / 2, (-k * px - py) / 2];
            px -= min(max(px, -2.0 * r), 0.0);
            return -hypot(px, py) * sign(py);
          }
          function smooth_union(d1, d2, k) {
            let h = min(max(0.5 + 0.5 * (d2 - d1) / k, 0.0), 1.0);
            return (d2 * (1 - h) + d1 * h) - k * h * (1.0 - h);
          }
          return smooth_union(
            smooth_union(
              smooth_union(
                smooth_union(
                  smooth_union(
                    hypot(x + 0.2, y) - 0.4,
                    hypot(x - 0.2, y) - 0.4,
                    0.05),
                    hypot(x - 0.5, y + 0.3) - 0.3,
                    0.02), 
                    box(x - 0.3, y - 0.4, 0.1, 0.4), 
                    0.05),
                    box(x + 0.3, y + 0.1, 0.1, 0.9), 
                    0.05),
                    trig(x - 0.5, -y - 0.62, 0.12), 
                    0.05);
          `,
          // resolution: 10,
          // showGrid: true,
    });

    init2DFREP("#frep-flower", {
      sdfFuncString: `
        return flowerWithStemSDF(x, y, 10, 0.4, .03);

        function flowerWithStemSDF(x, y, numPetals, flowerSize, stemWidth) {
            // angle in polar coordinates
            const theta = Math.atan2(y, x);
            
            // radius in polar coordinates
            const r = Math.sqrt(x * x + y * y); 

            // sine function to create petals
            const petalSin = Math.sin(numPetals * theta); 

            // modulate radius for petal effect
            const petalEffect = 0.2 * petalSin * petalSin * petalSin + 0.8; 

            // distance to the flower boundary
            const flowerDistance = r - flowerSize * petalEffect; 

            // stem calculations

            // noise along the y-axis for the stem
            const noise = simpleNoise(y);
            
            // distance to the stem boundary with noise
            let stemDistance = Math.abs(x - noise) - stemWidth;

            // combine flower and stem using a smooth minimum function
            return y < 0 ? flowerDistance : Math.min(flowerDistance, stemDistance);
        }

        function simpleNoise(x) {
            return 0.03 * Math.sin(7 * x);
        }

      `
    });



    

    init2DFREP("#frep-sampling-issue", {
      sdfFuncString: `
          let myRect = rectangle(1.2, 0.2)
          let myCircle = circle(.54)
          let final = union(myRect, myCircle)

          return final(x, y);

      `,
      resolution: 10,
      showGrid: true,
    });
  },
  "mesh-voxel": async () => {
    const rawMarkdown = await fetch("./mesh-voxel.md").then(res => res.text());
    const html = marked(rawMarkdown);
    document.querySelector("main").innerHTML = html;
  },
  "cad-history": async () => {
    const rawMarkdown = await fetch("./cad-history.md").then(res => res.text());
    const html = marked(rawMarkdown);
    document.querySelector("main").innerHTML = html;
  },
  "constraints": async () => {
    const rawMarkdown = await fetch("./constraints.md").then(res => res.text());
    const html = marked(rawMarkdown);
    document.querySelector("main").innerHTML = html;

    initGraphDecompositions("#graph-solver");

    initInteractiveConstraints("#interactive-constraint", {
      pts: {
        "a": randomPoint(),
        "b": randomPoint(),
        "c": randomPoint()
      },
      constraints: [
        createDistanceConstraint("a", "b", 60),
        createDistanceConstraint("b", "c", 30),
        {
          eqs: [
            // "a_x",
            // "a_y",
            // "c_x - a_x",
            // "c_y - b_y"
          ]
        } 
      ],
      fillMap: {
          "a": "green",
          "b": "blue",
          "c": "red"
        },
      lines: [
          ["a", "b"],
          ["b", "c"]
        ],
      // showHeatmap: false
    });

    initInteractiveConstraints("#interactive-constraint-demo", {
      pts: {
        "a": randomPoint(),
        "b": randomPoint(),
        "c": randomPoint()
      },
      constraints: [
        createDistanceConstraint("a", "b", 60),
        // createDistanceConstraint("b", "c", 30),
        {
          eqs: [
            "a_x",
            "a_y",
            "c_x - a_x",
            "c_y - b_y"
          ]
        } 
      ],
      fillMap: {
          "a": "green",
          "b": "blue",
          "c": "red"
        },
      lines: [
          ["a", "b"],
          ["b", "c"]
        ],
      showHeatmap: true
    });

    initInteractiveConstraints("#interactive-constraint-angles", {
      pts: {
        "a": randomPoint(),
        "b": randomPoint(),
        "c": randomPoint(),
        "d": randomPoint()
      },
      constraints: [
        // createDistanceConstraint("a", "b", 100),
        createPointLineConstraint("b", "d", "c", 0),
        // createDistanceConstraint("c", "d", 100),
        createAngleConstraint("a", "b", "c", "d", 0),
        {
          eqs: [
            // "a_x",
            // "a_y",
            // "c_x - a_x",
            // "c_y - b_y"
          ]
        } 
      ],
      lines: [
          ["a", "b"],
          ["c", "d"]
        ],
      // showHeatmap: true
    });

    initInteractiveConstraints("#interactive-constraint-parallel", {
      pts: {
        "a": randomPoint(),
        "b": randomPoint(),
        "c": randomPoint(),
        "d": randomPoint()
      },
      constraints: [
        createParallel("a", "b", "c", "d"),
      ],
      lines: [
          ["a", "b"],
          ["c", "d"]
        ],
      // showHeatmap: true
    });

    initInteractiveConstraints("#interactive-constraint-parallel-equal", {
      pts: {
        "a": randomPoint(),
        "b": randomPoint(),
        "c": randomPoint(),
        "d": randomPoint()
      },
      constraints: [
        createParallel("a", "b", "c", "d"),
        createEqual("a", "b", "c", "d"),
      ],
      lines: [
          ["a", "b"],
          ["c", "d"]
        ],
      // showHeatmap: true
    });
  },
  "brep": async () => {
    const rawMarkdown = await fetch("./brep.md").then(res => res.text());
    const html = marked(rawMarkdown);
    document.querySelector("main").innerHTML = html;
  },
  "interfaces": async () => {
      const rawMarkdown = await fetch("./interfaces.md").then(res => res.text());
      const html = marked(rawMarkdown);
      document.querySelector("main").innerHTML = html;
  },
  "generative": async () => {
      const rawMarkdown = await fetch("./generative.md").then(res => res.text());
      const html = marked(rawMarkdown);
      document.querySelector("main").innerHTML = html;
  },
}

window.onload = () => {
  const setMain = (hash) => {
    document.querySelector("main").innerHTML = "";
    if (hash in pages) pages[hash]();

    // hash = hash.replace('#', '');
  }

  let hash = window.location.hash.replace('#', '');
  setMain(hash);

  window.addEventListener("hashchange", () => {
    let hash = window.location.hash.replace('#', '');
    setMain(hash);
  })
};

function randInRange(min, max) {
  return Math.random()*(max-min)+min;
}

function randomPoint() {
  return { x: randInRange(-80, 80), y: randInRange(-80, 80) }
}

function createAngleConstraint(p0, p1, p2, p3, angle) {
  let l1p1x = `${p0}_x`;
  let l1p1y = `${p0}_y`;

  let l1p2x = `${p1}_x`;
  let l1p2y = `${p1}_y`;

  let l2p1x = `${p2}_x`;
  let l2p1y = `${p2}_y`;

  let l2p2x = `${p3}_x`;
  let l2p2y = `${p3}_y`;

  let r1 = Math.cos(Math.PI/180 * angle).toFixed(8);
  let r2 = Math.sin(Math.PI/180 * angle).toFixed(8);

  let dx1 = `(${l1p2x} - ${l1p1x})`
  let dy1 = `(${l1p2y} - ${l1p1y})`

  let dx3 = `(${dx1}*${r1} - ${dy1}*${r2})`;
  let dy3 = `(${dx1}*${r2} + ${dy1}*${r1})`;

  let dx2 = `(${l2p2x} - ${l2p1x})`
  let dy2 = `(${l2p2y} - ${l2p1y})`

  let d = `(${dx3}*${dx2} + ${dy3}*${dy2})`;   // dot product of the 2 vectors
  let l2 = `(sqrt(${dx3}^2+${dy3}^2)*sqrt(${dx2}^2+${dy2}^2))` // product of the squared lengths
  
  return {
    eqs: [`${d}/${l2}`]
  };
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

function createPointLineConstraint(p0, p1, p2, dist) {
    let px = `${p0}_x`;
    let py = `${p0}_y`;

    let lp1x = `${p1}_x`;
    let lp1y = `${p1}_y`;

    let lp2x = `${p2}_x`;
    let lp2y = `${p2}_y`;

    let top = `sqrt( ((${lp2y} - ${lp1y})*${px} - (${lp2x} - ${lp1x})*${py} + ${lp2x} * ${lp1y} - ${lp2y} * ${lp1x})^2)`
    let bottom = `sqrt( (${lp2x} - ${lp1x})^2 + (${lp2y}-${lp1y})^2 )`;

    return {
      eqs: [`${top}/${bottom} - ${dist}`] // ${top}/${bottom} - ${dist}
    }
}

function createParallel(p0, p1, p2, p3) {
    let l1p1x = `${p0}_x`;
    let l1p1y = `${p0}_y`;

    let l1p2x = `${p1}_x`;
    let l1p2y = `${p1}_y`;

    let l2p1x = `${p2}_x`;
    let l2p1y = `${p2}_y`;

    let l2p2x = `${p3}_x`;
    let l2p2y = `${p3}_y`;

    let top = `(neg(${l1p2x}) + ${l1p1x}) * (${l2p2y} - ${l2p1y}) + (${l1p2y} - ${l1p1y}) * (${l2p2x} - ${l2p1x})`

    return {
      eqs: [`${top}`]
    };
}


function createEqual(p0, p1, p2, p3) {
  let l1p1x = `${p0}_x`;
  let l1p1y = `${p0}_y`;

  let l1p2x = `${p1}_x`;
  let l1p2y = `${p1}_y`;

  let l2p1x = `${p2}_x`;
  let l2p1y = `${p2}_y`;

  let l2p2x = `${p3}_x`;
  let l2p2y = `${p3}_y`;

  let d1 = `sqrt((${l1p2x}-${l1p1x})^2+(${l1p2y}-${l1p1y})^2)`
  let d2 = `sqrt((${l2p2x}-${l2p1x})^2+(${l2p2y}-${l2p1y})^2)`

  return {
    eqs: [`${d2} - ${d1}`]
  }
}




