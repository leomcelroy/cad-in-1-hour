# Geometric Constraint Solvers

Constraint solvers are allow designers to describe geometry based on relationships like coincidence between points, distances, and angles.

![](./assets/onshape-sketch.png)

There are a variety of approaches to constraint solving which can be surveyed in these papers.

One of the leaders of the field was Christoph M. Hoffmann who spent a majority of his career at Purdue University. 
A majority of the papers linked were written by Christoph and his collaborators.

Broadly constraint solvers can be broken down into

- Algebraic
  - Symbolic
  - Numerical
- Logic Based
- Graph Techniques
  - Constructive

Commerical solvers tend to mix approaches which are optimized for various scenerios.

For general reviews on constraint solving:

[_A Geometric Constraint Solver (1993)_](./papers/bouma-1993.pdf)

[_A brief on constraint solving (2004)_](./papers/constraint-brief.pdf)

[_Geometric Constraint Solving in Parametric CAD (2011)_](./papers/geo-constraints-cad.pdf)

[_A review on geometric constraint solving (2022)_](./papers/geo-constraint-review-2022.pdf)

Regarding open source constraint solvers there is [FreeCAD's planegcs](https://github.com/FreeCAD/FreeCAD/tree/main/src/Mod/Sketcher/App/planegcs) 
(which you can find [some discussion about here](https://forum.freecad.org/viewtopic.php?t=26737) and a [WASM port here](https://github.com/Salusoft89/planegcs))
and Solvespace's solver.

One of the best write ups on developing a constraint solver comes from [Solvespace](https://solvespace.com/index.pl). 

Solvespace was created by Jonathan Westhues who wrote his one B-Rep engine and geometric constraint solver from scratch.

Solvespace is an extremely well made small CAD tool that is quite useable though not quite at feature parity with industrial tools.
The primary missing features are the ability to fillet and chamfer geometry after the fact.

Westhues wrote up the inner workings of his [constraint solver here](./papers/sketchflat.pdf).
The document primarily describes a numerical approach to constraint solving.

Another write up of an [optimization approach to constraint solving can be found here](./papers/optimization-solver.pdf).

Another excellent write up by Matt Keeter on a [very simple least-squares gradient descent solver can be found here](https://www.mattkeeter.com/projects/constraints/).

Below I'll describe my own similar approach to numerical constraint solving in much greater detail (and JavaScipt)

### Numerical

Let's start with a simple constraint system:

- Point A in green is fixed at 0, 0.
- Point B in blue is 10 units away from point A.
- Point C is vertical to Point A.
- Point C is horizontal to Point B.

<div id="interactive-constraint" class="interactive-demo"></div>


Let's first think about how we could describe this system algebraically.

- `a_x = 0` and `a_y = 0`
- `sqrt( (b_x - a_x)^2 + (b_y - a_y)^2 ) = 10`
- `c_x = a_x`
- `c_y = b_y`

Now that we have this system of equations how could we go about solving it.

We could try to do so algebraically but this could be challanging as we require more variables.

Instead (as the section title suggests) let's go about it numerically.

This means we are going to use the computer for what it's really good at. 
Doing lots of calculations repeated while attempting to approach a solution.

We will need to first develop a cost function. 
We'll be using the gradient of this function to approach a solution so we want the solution to occur at some sort of extrema point.
Let's use the minimum and the structure our cost function so the absolute minimums occur at 0.
We can guarantee this by setting our equations to 0 and then take the same of each of them squared, so the 4 equations become:

- `a_x - 0 = 0` and `a_y - 0 = 0`
- `sqrt( (b_x - a_x)^2 + (b_y - a_y)^2 ) - 10 = 0`
- `c_x - a_x = 0`
- `c_y - b_y = 0`

Which when all squared and added together become:

```
(a_x - 0)^2 + (a_y - 0)^2 
+ (sqrt( (b_x - a_x)^2 + (b_y - a_y)^2 ) - 10)^2
+ (c_x - a_x)^2
+ (c_y - b_y)^2
= 0
```

You can imagine gradient descent like the [image below from here](https://medium.com/@jaleeladejumo/gradient-descent-from-scratch-batch-gradient-descent-stochastic-gradient-descent-and-mini-batch-def681187473).

![](./assets/gradient-descent.webp)

Remember though our function is most likely in higher than 3 dimensions. 
There are two degrees of freedom for each point.

To apply gradient descent well also need the gradient at each evalution point.
We can obtain this using [automatic differentiation](./papers/auto-diff.pdf) (in this case forward mode).

Note that the equations above are not written in JavaScript, for convience I found it easier to write my own little differentable calculator language.
The explanation below will explain why this was neccessary (it wasn't, but it did provide some convience).

You can play with this calculator below it supports

- addition: `+`
- subtraction: `-`
- multiplication: `*`
- division: `/`
- negative: `neg`
- power (with whole numbers): `^`
- exponentiation (with whole numbers): `exp`
- logarithm (with whole numbers): `log`
- trigonometric functions: `sin`, `cos`, `tan`
- inverse trigonometric functions: `asin`, `acos`, `atan`

This works by representing numbers as dual numbers, which are pairs a value and it's derivative.

```js
function valder (val, der) {
  return {
    type: "valder",
    val: val,
    der: der,
  }
}
```

We then implement all of our arithmetic operations to work with these dual numbers and encode rules for differentiation into these functions.

For one of the simpler examples let's look at plus.

```js
function plus(x0, x1) {
  if ((typeof x0 === "number") && (typeof x1 === "number") && !isNaN(x0) && !isNaN(x1)) {
    return x0 + x1
  } else if ((x0.type === "valder") || (x1.type === "valder")) {

    if ((typeof x0 === "number") && (typeof x1 !== "number")) {
      x0 = valder(x0, x1.der.map(temp => 0));
    }

    if ((typeof x1 === "number") && (typeof x0 !== "number")) {
      x1 = valder(x1, x0.der.map(temp => 0));
    }

    return valder(plus(x0.val, x1.val), x0.der.map((temp, index) => plus(temp, x1.der[index])))
  }
}
```

Notice how we apply the chain rule when calculating the derivative value for our multiplication function.

```js
function mul(x0, x1) {
  if ((typeof x0 === "number") && (typeof x1 === "number") && !isNaN(x0) && !isNaN(x1)) {
    return x0 * x1
  } else if ((x0.type === "valder") || (x1.type === "valder")) {

    if ((typeof x0 === "number") && (typeof x1 !== "number")) {
      x0 = valder(x0, x1.der.map(temp => 0));
    }

    if ((typeof x1 === "number") && (typeof x0 !== "number")) {
      x1 = valder(x1, x0.der.map(temp => 0));
    }

    return valder(mul(x0.val, x1.val), x1.der.map((temp, index) => plus(mul(temp, x0.val), mul(x1.val, x0.der[index]))));
  }
}
```

You can find the [full automatic differentiation implementation here](./js/autodiff.js).

Now just our distance equation will become 

```js
function distance(d, p0, p1) {

  const p0x = valder(p0[0], [1, 0, 0, 0]); 
  const p0y = valder(p0[1], [0, 1, 0, 0]); 
  const p1x = valder(p1[0], [0, 0, 1, 0]); 
  const p1y = valder(p1[1], [0, 0, 0, 1]);

  return minus(
    d, 
    sqrt(
      plus(
        power(minus(p1x, p0x), 2), 
        power(minus(p1y, p0y), 2)
      )
    )
  );
}
```

which can start to motivate why we want our little language. 
There is still a better reason to come though.

Speaking of which [the parser for the language is available here](./js/parser.js).

The [evaluator for the langauge can be found here](./js/evaluate.js).

It provides us with this evaluate function:

```js
evaluate(equation, variableValues)
```

Which can be used as such:

```js
evaluate("sin(x)", { x: 1 })
```

Okay so now that we can express and evaluate the algebraic representations of our constraints let's solve our constraint problem by minimizing our cost function.

We could use strict gradient descent but there are algorithms that work better with these sorts of non-linear least squares problems.
FreeCAD's solver planegcs gives options to use DogLeg, Levenberg-Marquardt, BFGS or SQP. 
You can find a variety of [non-linear least squares optimization algorithms explained here](./papers/non-linear-least-squares.pdf).

I've found the Levenberg–Marquardt algorithm works quite well.
The Levenberg-Marquardt interpolates between Gauss-Newton and gradient descent.

You can find [the complete implementation of the Levenberg-Marquardt and the numerical equation system solver here](./js/solveSystem.js).

It provides us with this function:

```js

function solveSystem(eqns, vars, ops) {
  ...
}
```

`eqns` is a list of equation strings, 
`vars` is an object of initial guesses of the form `{ "x": 1 }`,
`ops` is optional arguments which include `{ forwardSubs, epsilon }`. 
Note that you can provide a list of forward substitions.
This is one of the primary conviences of our choice to use a little language and to represent our equations as strings. 
We can use string replacement to "symbolically" substitute some variables.
This is convienent for known equality constraints like coincidence, vertical, or horizontal.

So now with all of that we can describe our constrained system like so:

```js
// a helper function for creating distance constraints
function createDistanceConstraint(p0, p1, dist) {
  const p0x = `${p0}_x`;
  const p1x = `${p1}_x`;
  const p0y = `${p0}_y`;
  const p1y = `${p1}_y`;

  return `${dist} - sqrt((${p1x}-${p0x})^2+(${p1y}-${p0y})^2)`
}

const constrainedGeometry = {
    pts: {
      a: { x: 50, y: 50 },
      b: { x: 25,  y: 25 },
      c: { x: 0,  y: 50 }
    },
    constraints: [
      createDistanceConstraint("a", "b", 10),
      "a_x",
      "a_y",
      "c_x - a_x",
      "c_y - b_y"
    ]
}

const initialVals = {};

// break each point into its x and y variables
Object.entries(constrainedGeometry.pts).forEach(([id, pt]) => {
  initialVals[`${id}_x`] = pt.x;
  initialVals[`${id}_y`] = pt.y;
});

const [ satisfied, solutions ] = solveSystem(
  constrainedGeometry.constraints, 
  initialVals
);

// update the geometry
Object.entries(solutions).forEach(([id, val]) => {
  const [ptId, xy] = id.split("_");
  constrainedGeometry.pts[ptId][xy] = val;
});
```

One of the benefits of this approach and having to provide an initial guess is that we can inform that guess from user interaction.
If a user drags a piece of geometry and we set the initial guess to that target we will likely find a solution near where the user requested.
This can make the solver feel more intuitive to use.

<div id="interactive-constraint-angles" class="interactive-demo"></div>

Show variety of constraint equations

### Graph Constructive

The dominant approach to constraint solving today is analyize the constraint graph
to develop a solution plan followed by a solver that recursively solves these sub problems and 
recombines sub-solutions.

There are a variety of approaches to these constructive solvers.
Some reviews of decomposition approaches to constraint solving can be found below:

[_Decomposition Plans for Geometric Constraint Systems, Part I: Performance Measures for CAD (2001)_](./papers/decomposition-plans-1.pdf)

[_Decomposition Plans for Geometric Constraint Problems, Part II: New Algorithms (2001)_](./papers/decomposition-plans-2.pdf)

The two papers above are once agian from Hoffman and his collaborators Andrew Lomonosov and Meera Sitharam.
Sitharam is [currently at the University of Florida](https://www.cise.ufl.edu/~sitharam/) and did a lot of work developing
the Frontier Vertex Algorithm for constraint solving. 
[According to Bettig and Hoffman](./papers/geo-constraints-cad.pdf) the Frontier Vertex Algorithm completes graph decomposition.

![](./assets/frontier-vertex-complete.png)

[An implementation of this algorithm from Sitharam's group can be found here](https://github.com/Geoplexity/Frontier).

Other reviews can be found in:

[_Decomposition of Geometric Constraint Systems: a Survey (2006)_](./papers/decomposition-2006.pdf)

[_Geometric Constraint Solver (2016)_](./papers/These-Moussaoui_Nov_2016.pdf)

Specific implementations of graph constructive solvers can be found in these papers:

[_A Graph-Constructive Approach to Solving Systems of Geometric Constraints (1997)_](./papers/fudos-1997.pdf)

[_A 2D geometric constraint solver using a graph reduction method (2010)_](./papers/aoudia-2010.pdf)

Hoffman and Joan-Arinyo claim that ["such solvers can be implemented with minimal effort"](./papers/joan-arinyo-1997).

![](./assets/minimal-effort.png)

And I took that personal. So let's do it...

As previously mentioned the first commerical constraint solver was developed by D-Cubed Ltd (once again based in Cambridge).
D-Cubed was founded by John Owen and based their solver 2D DCM on work developed by Owen
and described in his 1991 paper [_Algebraic Solution for Geometry from Dimensional Constraints_](./papers/owen-constraints.pdf)

The first step is to understand what exactly is a constraint graph.

Below depicts a triangle with a distance constraint on each edge and its corresponding constraint graph.

![](./assets/constraint-graph.png)

Owen depicts this constrained geometry and its corresponding constraint graph.

![](./assets/owen-constraint-graph.png)

The objective is to break the graph down into triangles which can be solved independently and recombined to form our target geometry.
A key insight is that under a certain set of constriants each sub-problem acts as a rigid body which can be repositioned by sliding or rotating it in space.

While analyzing our constraint graph we can also determine whether or not the system is well-constrained, under-constrained, or over-constrained.
If the system is unsolvable the graph can also help use identify which geometric entities or constraints cause issues.

Owen describes his analysis algorithm as such:

![](./assets/owen-algorithm.png)

The first step is to split the graph into biconnected components.
A biconnected component means if you remove two points you can split the graph into two graphs.
This pair of points is referred to as an articulation pair.

In Owen's constraint graph we see 3 articulation pairs.

![](./assets/owen-pairs.png)

To reduce the graph we split at one of these articulation pairs. 
Between the two nodes of that pair we then add a virtual bond, unless those nodes are already connected, or the graph has exactly one more complex subgraph.
Repeat this process until the graph can not be split further.

A tree of this decomposition can be found in [this 2022 review paper](./papers/geo-constraints-cad.pdf).

![](./assets/zou-graph-tree.png)

The final subgraphs are the leaves of the tree.

![](./assets/zou-leaves.png)

Let's figure out what this shape is.

There are 4 points and 4 lines. 
Each point as a constraint between them which will be a distance constraint.
There is one constraint between 2 line which is an angle constraint.
A visual representation of this can be seen below.

![](./assets/zou-geometry.png)

It's a rectangle.

We can represent the graph like so:

```js
{
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
        { id: 'edge2', type: 'distance', source: 'point1', target: 'point2' },
        { id: 'edge3', type: 'distance', source: 'point2', target: 'point3' },
        { id: 'edge4', type: 'distance', source: 'point3', target: 'point4' },
        { id: 'edge5', type: 'distance', source: 'point4', target: 'point1' },
        { id: 'edge6', type: 'connection', source: 'line1', target: 'point1' },
        { id: 'edge7', type: 'connection', source: 'line2', target: 'point1' },
        { id: 'edge8', type: 'connection', source: 'line2', target: 'point2' },
        { id: 'edge9', type: 'connection', source: 'line3', target: 'point2' },
        { id: 'edge10', type: 'connection', source: 'line3', target: 'point3' },
        { id: 'edge11', type: 'connection', source: 'line4', target: 'point3' },
        { id: 'edge12', type: 'connection', source: 'line4', target: 'point4' },
        { id: 'edge13', type: 'connection', source: 'line1', target: 'point4' },
    ]
}
```

To find articulation pairs we'll first have to find articulation points.

```js
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
```

We can then identify pairs by removing a point (point1) and then checking for new articulation points (point2).
If there are new articulation points then point1 and point2 form an articulation pair.

```js
function findArticulationPairs(graph) {
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
```

[An implementation of splitting the graph at these points can be found (somewhere in) here](./demos/constructive-solver.js).

You can see it being applied in the interactive demo below that shows the reduction of the rectangle.
Virtual bonds are denoted with dashed lines. 
Nodes for points have a black border.

<div id="graph-solver" class="interactive-demo"></div>

Let's convert our triangles into geometric elements.

![](./assets/graph-triangles.png)

We can now walk the decomposition graph in reverse to reconstruct our geometry.

![](./assets/recombine.png)

Notice how the vitrual bond (dashed line) represents a relative distance between two points,
but we can't assign that distance and place the points until we can solve the relative distance with another subgraph of the system.

We can see our final geometry lines up with our original picture well.

![](./assets/final-construct.png)

These sub-systems can be solved in a variety of ways.
Owen solves them algebraically using quadratics.