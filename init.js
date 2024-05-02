import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm'
import { initInteractiveConstraints } from "./demos/constraints.js";
import { init2DFREP } from "./demos/frep-2d.js";
import { initGraphDecompositions } from "./demos/constructive-solver.js";

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

// get hash argument, if none then readme

const pages = {
  "": async () => {
    const rawMarkdown = await fetch("./README.md").then(res => res.text());
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
        
        return mySDF(x+.4, y-.3)
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
        "a": { x: 0, y: 0 },
        "b": { x: 0,  y: 50 },
        "c": { x: 24,  y: 50 }
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
          "a": "black",
          "b": "black",
          "c": "black"
        },
      lines: [
          ["a", "b"],
          ["b", "c"]
        ],
      // showHeatmap: false
    });

    initInteractiveConstraints("#interactive-constraint-angles", {
      pts: {
        "a": { x: 10, y: 0 },
        "b": { x: 0,  y: 50 },
        "c": { x: 24,  y: 50 },
        "d": { x: 60,  y: 70 }
      },
      constraints: [
        // createDistanceConstraint("a", "b", 100),
        createPointLineConstraint("b", "d", "c", 0),
        // createDistanceConstraint("c", "d", 100),
        createAngleConstraint("a", "b", "c", "d", 0),
        {
          eqs: [
            "a_x",
            // "a_y",
            // "c_x - a_x",
            // "c_y - b_y"
          ]
        } 
      ],
      fillMap: {
          "a": "black",
          "b": "black",
          "c": "black"
        },
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
  "generative": async () => {},
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

// function createParallel(p0, p1, ) {
//     let l1p1x = `x${this.points[0].id}`;
//     let l1p1y = `y${this.points[0].id}`;

//     let l1p2x = `x${this.points[1].id}`;
//     let l1p2y = `y${this.points[1].id}`;

//     let l2p1x = `x${this.points[2].id}`;
//     let l2p1y = `y${this.points[2].id}`;

//     let l2p2x = `x${this.points[3].id}`;
//     let l2p2y = `y${this.points[3].id}`;

//     let top = `(-${l1p2x} + ${l1p1x}) * (${l2p2y} - ${l2p1y}) + (${l1p2y} - ${l1p1y}) * (${l2p2x} - ${l2p1x})`

//     return [`${top}`];
// }




