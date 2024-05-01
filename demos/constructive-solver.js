import { html, svg, render } from "../libs/lit-html.js";
import { createListener } from "../js/createListener.js";

const owensTest = {
    nodes: [
        { id: 'point1', type: 'point' },
        { id: 'point2', type: 'point' },
        { id: 'point3', type: 'point' },
        { id: 'point4', type: 'point' },
        { id: 'point5', type: 'point' },
        { id: 'line1', type: 'line' },
        { id: 'line2', type: 'line' },
        { id: 'line3', type: 'line' },
        { id: 'line4', type: 'line' },
        { id: 'line5', type: 'line' }
    ],
    edges: [
        { id: 'edge1', type: 'angle', source: 'line1', target: 'line2' },
        { id: 'edge2', type: 'angle', source: 'line4', target: 'line5' },
        { id: 'edge3', type: 'distance', source: 'point1', target: 'point2' },
        { id: 'edge4', type: 'distance', source: 'point2', target: 'point3' },
        { id: 'edge5', type: 'distance', source: 'point3', target: 'point4' },
        { id: 'edge6', type: 'distance', source: 'point4', target: 'point5' },
        { id: 'edge7', type: 'distance', source: 'point5', target: 'point1' },
        { id: 'edge8', type: 'connection', source: 'line1', target: 'point2' },
        { id: 'edge9', type: 'connection', source: 'line2', target: 'point3' },
        { id: 'edge10', type: 'connection', source: 'line3', target: 'point4' },
        { id: 'edge11', type: 'connection', source: 'line4', target: 'point5' },
        { id: 'edge12', type: 'connection', source: 'line5', target: 'point1' },
        { id: 'edge13', type: 'connection', source: 'line1', target: 'point1' },
        { id: 'edge14', type: 'connection', source: 'line2', target: 'point2' },
        { id: 'edge15', type: 'connection', source: 'line3', target: 'point3' },
        { id: 'edge16', type: 'connection', source: 'line4', target: 'point4' },
        { id: 'edge17', type: 'connection', source: 'line5', target: 'point5' },
    ]
};

const zouTest = {
    nodes: [
        { id: 'point1', type: 'point' },
        { id: 'point2', type: 'point' },
        { id: 'point3', type: 'point' },
        { id: 'point4', type: 'point' },
        { id: 'line1', type: 'line' },
        { id: 'line2', type: 'line' },
        { id: 'line3', type: 'line' },
        { id: 'line4', type: 'line' },
    ],
    edges: [
        { id: 'edge1', type: 'angle', source: 'line1', target: 'line4' },
        { id: 'edge3', type: 'distance', source: 'point1', target: 'point2' },
        { id: 'edge4', type: 'distance', source: 'point2', target: 'point3' },
        { id: 'edge5', type: 'distance', source: 'point3', target: 'point4' },
        { id: 'edge7', type: 'distance', source: 'point4', target: 'point1' },
        { id: 'edge8', type: 'connection', source: 'line1', target: 'point1' },
        { id: 'edge9', type: 'connection', source: 'line2', target: 'point1' },
        { id: 'edge10', type: 'connection', source: 'line2', target: 'point2' },
        { id: 'edge11', type: 'connection', source: 'line3', target: 'point2' },
        { id: 'edge12', type: 'connection', source: 'line3', target: 'point3' },
        { id: 'edge13', type: 'connection', source: 'line4', target: 'point3' },
        { id: 'edge14', type: 'connection', source: 'line4', target: 'point4' },
        { id: 'edge15', type: 'connection', source: 'line1', target: 'point4' },
    ]
};



export function initGraphDecompositions(selector) {
  const container = document.querySelector(selector);
  const id = `_${Date.now()}`
  container.innerHTML = `
    <style>
      #${id}-container {
        display: flex;
        overflow: auto;
        border-radius: 4px;
        border: 2px solid black;
        padding: 10px;
      }

      #${id} {
        display: flex;
        gap: 20px;
      }

      #${id} svg {
        border-radius: 4px;
        background: #f3f3f3;
      }
    </style>
    <div id="${id}-container">
        <div id="${id}">

        </div>
    </div>
  `

  visualizeGraph(`#${id}`, zouTest)
  let graph = zouTest;
  let pairs = findArticulationPairs(zouTest);

  let MAX_STEPS = 10000;
  let steps = 0;
  while (pairs.length  > 0 && steps < MAX_STEPS) {
      graph = splitGraphAtArticulationPair(graph, pairs[0])
      pairs = findArticulationPairs(graph);
      visualizeGraph(`#${id}`, graph); 
      steps++;
  }
}


// const triangles = findDisconnectedSubgraphs(graph);
// renderGeoGraph(triangles)

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function visualizeGraph(container, graph) {
    graph = copy(graph);

    if (typeof d3 === 'undefined') {
        console.error('D3.js is not loaded. Please ensure D3.js is included in your HTML.');
        return;
    }

    const width = 400, height = 400;

    // Create the SVG container
    const svg = d3.select(container).append('svg')
        .attr('width', width)
        .attr('min-width', width)
        .attr('height', height)
        .style('border', '1px solid black');

    // Set up the simulation with forces
    const simulation = d3.forceSimulation(graph.nodes)
        .force('link', d3.forceLink(graph.edges).id(d => d.id).distance(50))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('x', d3.forceX(width / 2).strength(0.1))
        .force('y', d3.forceY(height / 2).strength(0.1));

    // Create the links (lines)
    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graph.edges)
        .enter().append('line')
        .attr('stroke-width', 2)
        .attr("stroke-dasharray", d => d.type === 'virtual' ? "5, 5" : "none")
        .attr('stroke', d => d.type === 'virtual' ? 'grey' : 'black'); // Conditionally set the color


    // Create the nodes (circles)
    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(graph.nodes)
        .enter().append('circle')
        .attr('r', 8)
        .attr("stroke-width", 3)
        .attr("stroke", d => {
          if (d.type === "line") return ""

          return "black"
        })
        .attr('fill', d => {

          const ogPoint = d.id.split("_")[0];
          const color = {
            "point1": "#f1ac4b",
            "point2": "#4ba1f1",
            "point3": "#e03132",
            "point4": "#4db05e",
            "line1": "purple",
            "line2": "#6eefe6",
            "line3": "#e1b2e5",
            "line4": "#e16919",
          }[ogPoint];

          return color;
        })
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Add labels to each node
    const labels = svg.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(graph.nodes)
        .enter().append('text')
        .text(d => d.id)
        .style("font-family", "monospace")
        .style("font-size", "10px")
        .style("transform", "translate(-10px, 10px)");

    // Update positions each tick
    simulation.on('tick', () => {
        link.attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('cx', d => d.x)
            .attr('cy', d => d.y);

        labels.attr('x', d => d.x + 15)
            .attr('y', d => d.y + 5);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function findArticulationPoints(graph) {
    const visited = {};
    const depth = {};
    const low = {};
    const parent = {};
    const articulationPoints = new Set();

    function dfs(nodeId, d) {
        visited[nodeId] = true;
        depth[nodeId] = d;
        low[nodeId] = d;
        let childCount = 0;
        let isArticulation = false;

        // Collect all adjacent nodes
        const adjacents = graph.edges
            .filter(edge => edge.source === nodeId || edge.target === nodeId)
            .map(edge => edge.source === nodeId ? edge.target : edge.source);

        adjacents.forEach(ni => {
            if (!visited[ni]) {
                parent[ni] = nodeId;
                childCount++;
                dfs(ni, d + 1);
                // Check if the subtree rooted at ni has connection back to one of ancestors of nodeId
                if (low[ni] >= depth[nodeId]) {
                    isArticulation = true;
                }
                low[nodeId] = Math.min(low[nodeId], low[ni]);
            } else if (ni !== parent[nodeId]) {
                low[nodeId] = Math.min(low[nodeId], depth[ni]);
            }
        });

        // Check articulation conditions
        if ((parent[nodeId] !== undefined && isArticulation) || (parent[nodeId] === undefined && childCount > 1)) {
            articulationPoints.add(nodeId);
        }
    }

    // Initialize DFS from all unvisited nodes (handles disconnected graphs)
    graph.nodes.forEach(node => {
        if (!visited[node.id]) {
            dfs(node.id, 0);
        }
    });

    return Array.from(articulationPoints);
}

function findArticulationPairs(graph) {
    // const articulationPoints = findArticulationPoints(graph);

    // if (articulationPoints.length > 0) {
    //     console.log("articulationPoints found")
    //     return articulationPoints;
    // }

    const pairs = [];

    graph.nodes.forEach((node, i) => {
        const newGraph = removeNode(graph, node.id)

        const ap = findArticulationPoints(newGraph);

        ap.forEach(n => {
            pairs.push([node.id, n]);
        })
    })

    return filterUniqueSets(pairs);
}

function removeNode(graph, nodeId) {
    const newGraph = JSON.parse(JSON.stringify(graph));
    newGraph.nodes = newGraph.nodes.filter(n => n.id !== nodeId);
    newGraph.edges = newGraph.edges.filter((e, j) => e.source !== nodeId && e.target !== nodeId);

    return newGraph
}

function filterUniqueSets(listOfSets) {
    const uniqueSets = new Set();  // To store unique canonical forms of each set
    const filteredSets = [];       // To store the final filtered sets

    listOfSets.forEach(set => {
        // Sort the set to normalize order and then join into a string to form a canonical representation
        const canonicalForm = set.sort().join('-');
        if (!uniqueSets.has(canonicalForm)) {
            uniqueSets.add(canonicalForm);
            filteredSets.push(set);  // Add the original set to the result list
        }
    });

    return filteredSets;
}

function findDisconnectedSubgraphs(graph) {
    const { nodes, edges } = graph;
    let visitedNodes = new Set();
    let subgraphs = [];

    // Helper function to perform DFS and collect nodes and edges of a component
    function dfs(node, component, edgeSet) {
        visitedNodes.add(node.id);
        component.nodes.push(node);

        // Retrieve all edges connected to the node and continue DFS for unvisited nodes
        const connectedEdges = edges.filter(edge => (edge.source === node.id || edge.target === node.id));
        connectedEdges.forEach(edge => {
            if (!edgeSet.has(edge.id)) {
                edgeSet.add(edge.id);
                component.edges.push(edge);
                const neighborId = edge.source === node.id ? edge.target : edge.source;
                if (!visitedNodes.has(neighborId)) {
                    const neighbor = nodes.find(n => n.id === neighborId);
                    dfs(neighbor, component, edgeSet);
                }
            }
        });
    }

    // Iterate through all nodes to ensure all components are found, including disconnected ones
    nodes.forEach(node => {
        if (!visitedNodes.has(node.id)) {
            let component = { nodes: [], edges: [] };
            let edgeSet = new Set();  // Set to track edges added to this component
            dfs(node, component, edgeSet);
            subgraphs.push(component);
        }
    });

    return subgraphs;
}

function splitGraphAtArticulationPoint(graph, articulationPoint, { pairId = "" } = {}) {

    const splitGraph = removeNode(graph, articulationPoint);

    const subgraphs = findDisconnectedSubgraphs(splitGraph);

    subgraphs.forEach((g, i) => {
        const nodeIds = new Set(g.nodes.map(n => n.id));


        const articulationNode = copy(graph.nodes.find(n => n.id === articulationPoint));
        articulationNode.id = `${articulationPoint}_${i}`
        

        const newEdges = [];

        graph.edges.forEach(e => {
            if (nodeIds.has(e.target) && e.source === articulationPoint) {
                const newEdge = copy(e);
                newEdge.source = articulationNode.id;
                newEdges.push(newEdge)
            }

            if (nodeIds.has(e.source) && e.target === articulationPoint) {
                const newEdge = copy(e);
                newEdge.target = articulationNode.id;
                newEdges.push(newEdge)
            }
        })

        if (newEdges.length === 0) return;

        g.nodes.push(articulationNode);
        g.edges = g.edges.concat(newEdges);

        if (pairId === "") return;

        const articulationPoints = findArticulationPoints(g);

        if (articulationPoints.length === 0) return;

        const virtualBondId = `${pairId}_virtual_edge`;

        let existingLink = false;

        graph.edges.forEach(e => {
            const ogTarget = e.target.split("_")[0];
            const ogSource = e.source.split("_")[0];
            const ogPairId = pairId.split("_")[0];
            const ogArticulationId = articulationPoint.split("_")[0];

            const localExistingLink = ogTarget === ogPairId && ogSource === ogArticulationId
                || ogSource === ogPairId && ogTarget === ogArticulationId;

            if (localExistingLink) {
                g.edges.push({
                    id: virtualBondId,
                    type: e.type,
                    source: `${articulationPoint}_${i}`,
                    target: `${pairId}_${i}`,
                })
            }

            existingLink = existingLink || localExistingLink;
        })

        if (!existingLink) {
            g.edges.push({
                id: virtualBondId,
                source: `${articulationPoint}_${i}`,
                target: `${pairId}_${i}`,
                type: "virtual"
            });
        }

        // check if g has no single bonds
        // and exactly one more complex subgraph
        // if so remove virtual bonds

        


    })


    graph.nodes = subgraphs.map(g => g.nodes).flat();
    graph.edges = subgraphs.map(g => g.edges).flat();
    graph = removeNode(graph, articulationPoint);

    return graph;


}

function splitGraphAtArticulationPair(graph, articulationPair) {

    const [ splitId0, splitId1 ] = articulationPair;

    const ogGraph = copy(graph);

    graph = removeNode(graph, splitId0);
    graph = splitGraphAtArticulationPoint(graph, splitId1);

    // add back in splitId0
    const returnPoint = copy(ogGraph.nodes.find(n => n.id === splitId0));
    graph.nodes.push(returnPoint);

    ogGraph.edges.forEach(e => {
        if (e.target === splitId0 || e.source === splitId0) {
            const newEdge = copy(e);
            graph.edges.push(newEdge)
        }
    })

    graph = splitGraphAtArticulationPoint(graph, splitId0, { pairId: splitId1 });


    return graph


}

export function renderGeoGraph(graphs) {
  // const targetEl = document.querySelector(elId);
    const targetEl = document.createElement("div");
    document.body.append(targetEl);

  // STATE
  const STATE = {
    pts: {
      "a": { x: 0, y: 0 },
      "b": { x: 0,  y: 50 },
      "c": { x: 24,  y: 50 }
    },
    constraints: [],
    fillMap: {
      "a": "black",
      "b": "black",
      "c": "black"
    },
    lines: [
      ["a", "b"],
      ["b", "c"]
    ],
    graphs: copy(graphs).map(g => {
        g.translate = {
          x: randInRange(20, 60), 
          y: randInRange(20, 60)
        };
        g.rotate = 0;

        return g
    })
  }

  const view = (state) => {
    return html`
      <style>
        #constraints {
          width: 700px;
          height: 400px;
          border: 1px solid black;
        }
      </style>
      <svg id="constraints" viewBox="-100 -100 200 200">
        ${state.lines.map(l => drawLine(l.map(id => Object.values(state.pts[id]) ) ) )}
        ${Object.entries(state.pts).map(drawPoint)}
        ${state.graphs.map(drawGraphs)}
      </svg>
    `
  }



  const pointsToString = points => points.map(p => p.join(",") ).join(" ");
  const drawPoint = ([id, pt], index) => svg`<circle handle data-id=${id} cx=${pt.x} cy=${pt.y} r="5" fill=${STATE.fillMap[id]} stroke="#928e8e"/>`
  const drawLine = (points) => {
    return svg`<polyline stroke="grey" stroke-width="3" fill="none" points=${pointsToString(points)} />`
  }

  function drawGraphs(graph) {
    console.log(graph);

    const edgeViews = [];

    graph.nodes.forEach((n, i) => {
        if (n.type === "point") {
            // edgeViews.push(drawPoint([ n.id, { x: 0, y: 0 } ]));
        }

        if (n.type === "line") {
            // edgeViews.push(svg`<polyline stroke="grey" stroke-width="3" fill="none" points="">`)
        }
    })

    graph.edges.forEach(e => {

    })

    return svg`
        <g>
            ${edgeViews}
        </g>
    `
  }


  const r = () => {
    render(view(STATE), targetEl);
  }

  STATE.r = r;

  r();

  const listen = createListener(targetEl);
  addHandleControl(STATE, listen);

}

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

function getAngle(cx, cy, ex, ey) {
    const dy = ey - cy;
    const dx = ex - cx;
    return Math.atan2(dy, dx);
}

function rotatePoint(cx, cy, x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // Translate point back to origin:
    x -= cx;
    y -= cy;
    // Rotate point
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    // Translate point back:
    x = newX + cx;
    y = newY + cy;
    return { x, y };
}

function randInRange(min, max) {
    return Math.random()*(max-min)+min
}




