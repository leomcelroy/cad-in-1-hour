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



visualizeGraph(zouTest)
let graph = zouTest;
let pairs = findArticulationPairs(zouTest);

let MAX_STEPS = 10000;
let steps = 0;
while (pairs.length  > 0 && steps < MAX_STEPS) {
    graph = splitGraphAtArticulationPair(graph, pairs[0])
    pairs = findArticulationPairs(graph);
    console.log({ graph, pairs });
    visualizeGraph(graph); 
    steps++;
}


function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function visualizeGraph(graph) {
    graph = copy(graph);

    if (typeof d3 === 'undefined') {
        console.error('D3.js is not loaded. Please ensure D3.js is included in your HTML.');
        return;
    }

    const width = 800, height = 600;

    // Create the SVG container
    const svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid black');

    // Set up the simulation with forces
    const simulation = d3.forceSimulation(graph.nodes)
        .force('link', d3.forceLink(graph.edges).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-500))
        .force('x', d3.forceX(width / 2).strength(0.1))
        .force('y', d3.forceY(height / 2).strength(0.1));

    // Create the links (lines)
    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graph.edges)
        .enter().append('line')
        .attr('stroke-width', 2)
        .attr('stroke', 'black');

    // Create the nodes (circles)
    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(graph.nodes)
        .enter().append('circle')
        .attr('r', 10)
        .attr('fill', 'skyblue')
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
        .attr('x', 8)
        .attr('y', 3);

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

function splitGraphAtArticulationPoint(graph, articulationPoint, pairId = "") {

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
        g.edges.push({
            id: virtualBondId,
            source: `${articulationPoint}_${i}`,
            target: `${pairId}_${i}`,
            type: "virtual"
        });

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

    graph = splitGraphAtArticulationPoint(graph, splitId0, splitId1);


    return graph


}




