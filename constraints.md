# Geometric Constraint Solvers

Constraint solvers allow designers to describe geometry based on relationships like coincidence between points, distances, and angles.

![](./assets/onshape-sketch.png)

There are a variety of approaches to constraint solving which can be surveyed in these papers.

One of the leaders of the field was Christoph Hoffmann who spent a majority of his career at Purdue University.
A majority of the papers linked were written by Christoph and his collaborators.

Broadly constraint solvers can be broken down into

- Algebraic
  - Symbolic
  - Numerical
- Logic Based
- Graph Techniques
  - Constructive

Commercial solvers tend to mix approaches which are optimized for various scenerios.

For general reviews on constraint solving:

[_A Geometric Constraint Solver (1993)_](https://docs.lib.purdue.edu/cgi/viewcontent.cgi?article=2067&context=cstech)

[_A brief on constraint solving (2004)_](https://upcommons.upc.edu/bitstream/handle/2117/83305/LSI-04-49-R.pdf?sequence=1&isAllowed=y)

[_Geometric Constraint Solving in Parametric CAD (2011)_](https://www.cs.purdue.edu/cgvlab/www/resources/papers/Bettig-Comp_and_Info_Sci_in_Eng-2011-Geometric_Constraint_Solving_In_Parametric_CAD.pdf)

[_A review on geometric constraint solving (2022)_](https://arxiv.org/pdf/2202.13795)

Regarding open source constraint solvers there is [FreeCAD's planegcs](https://github.com/FreeCAD/FreeCAD/tree/main/src/Mod/Sketcher/App/planegcs)
(which you can find [some discussion about here](https://forum.freecad.org/viewtopic.php?t=26737) and a [WASM port here](https://github.com/Salusoft89/planegcs))
and Solvespace's solver.

One of the best write ups on developing a constraint solver comes from [Solvespace](https://solvespace.com/index.pl).

Solvespace was created by Jonathan Westhues who wrote his own B-Rep engine and geometric constraint solver from scratch.

Solvespace is an extremely well made small CAD tool that is quite useable though not quite at feature parity with industrial tools.
The primary missing features are the ability to fillet and chamfer geometry after the fact.

Westhues wrote up the inner workings of his [constraint solver here](https://cq.cx/dl/sketchflat-internals.pdf).
The document primarily describes a numerical approach to constraint solving.

Another write up of an [optimization approach to constraint solving can be found here](https://www.sciencedirect.com/science/article/abs/pii/S0010448599000743).

Another excellent write up by Matt Keeter on a [very simple least-squares gradient descent solver can be found here](https://www.mattkeeter.com/projects/constraints/).

Below I'll describe my own similar approach to numerical constraint solving in much fine detail (and JavaScipt).

### Numerical

Let's start with a simple constraint system:

- Point A in green
- Point B in blue
- Point C is red
- A is 60 units from B
- B is 30 units from C

Click and drag on the points!

<div id="interactive-constraint" class="interactive-demo"></div>

See how the constraints are maintained as you drag points around.
You can toggle `show gradient` to see the solution space for each point as you drag it.
We'll understand what this is the gradient of in a moment.
For illustrative purpose let's add a few different types of constraints and the simplest one we can think of.

Imagine now

- Point A in green
- Point B in blue
- Point C is red
- Point A is fixed at 0, 0.
- Point B is 60 units away from point A.
- Point C is vertical to Point A.
- Point C is horizontal to Point B.

<div id="interactive-constraint-demo" class="interactive-demo"></div>

Let's first think about how we could describe this system algebraically.

- `a_x = 0` and `a_y = 0`
- `sqrt( (b_x - a_x)^2 + (b_y - a_y)^2 ) = 60`
- `c_x = a_x`
- `c_y = b_y`

Now that we have this system of equations how could we go about solving it.

We could try to do so symbolically but this could be challenging as we require more variables.

Instead (as the section title suggests) let's go about it numerically.

This means we are going to use the computer for what it's really good at.
Doing lots of calculations repeatedly while attempting to approach a solution.

We will need to first develop a cost function.
We'll be using the gradient of this function to approach a solution so we want the solution to occur at some sort of extrema point.
Let's use the minimum as our special point.
We will structure our cost function so the absolute minimums occur at 0.

We can guarantee this by setting our equations to 0.

- `a_x - 0 = 0` and `a_y - 0 = 0`
- `sqrt( (b_x - a_x)^2 + (b_y - a_y)^2 ) - 60 = 0`
- `c_x - a_x = 0`
- `c_y - b_y = 0`

And then squaring each term and taking the total sum.

```
(a_x - 0)^2 + (a_y - 0)^2
+ (sqrt( (b_x - a_x)^2 + (b_y - a_y)^2 ) - 60)^2
+ (c_x - a_x)^2
+ (c_y - b_y)^2
= 0
```

You can imagine gradient descent like the [image below from here](https://medium.com/@jaleeladejumo/gradient-descent-from-scratch-batch-gradient-descent-stochastic-gradient-descent-and-mini-batch-def681187473).

![](./assets/gradient-descent.webp)

Remember though our function is most likely in higher than 3 dimensions.
There are two degrees of freedom for each point.

To apply gradient descent well also need the gradient at each evalution point.
We can obtain this using [automatic differentiation](https://epubs.siam.org/doi/epdf/10.1137/080743627) (in this case forward mode).

Note that the equations above are not written in JavaScript, for convenience I found it easier to write my own little differentable calculator language.
The explanation below will explain why this was necessary (it wasn't, but it did provide some convenience).

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

The complexity of writing this can start to motivate why we want our little language.
There is still a better reason to come though.

Speaking of which [the parser for the language is available here](./js/parser.js).

The [evaluator for the langauge can be found here](./js/evaluate.js).

It provides us with this evaluate function:

```js
evaluate(equation, variableValues)
```

Which can be used as such:

```js
evaluate("x^2 + x - 4", { x: 1 })
```

which evaluates to

```js
{
  type: "valder",
  val: -2,
  der: [ 3 ]
}
```

Here is an example of a multivariable equation.

```js
evaluate("x^2+x-4 * y^2/4", { x: 1, y: 2 })
```

which evaluates to

```js
{
  "type": "valder",
  "val": -2,
  "der": [ 3, -4 ]
}
```

Okay so now that we can express and evaluate the algebraic representations of our constraints let's solve our constraint problem by minimizing our cost function.

We could use strict gradient descent but there are algorithms that work better with these sorts of non-linear least squares problems.
FreeCAD's solver planegcs gives options to use DogLeg, Levenberg-Marquardt, BFGS or SQP.
You can find a variety of [non-linear least squares optimization algorithms explained here](https://www2.imm.dtu.dk/pubdb/edoc/imm3215.pdf).

I've found the Levenberg–Marquardt algorithm works quite well.
The Levenberg-Marquardt interpolates between Gauss-Newton and gradient descent.

You can find [the complete implementation of the Levenberg-Marquardt and the numerical equation system solver here](./js/solveSystem.js).

It provides us with this function:

```js
function solveSystem(eqns, vars, ops) {
  ...
}
```
<br>

- `eqns` is a list of equation strings
- `vars` is an object of initial guesses of the form `{ "x": 1 }`
- `ops` is optional arguments which include `{ forwardSubs, epsilon }`

Note that you can provide a list of forward substitions.
This is one of the primary conveniences of our choice to use a little language and to represent our equations as strings.
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
      createDistanceConstraint("a", "b", 60),
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

Let's look at some more constraints in our editor.

Here we have a line-line angle constraint (in this case set to perpendicular) and a point line distance constraint (set to 0).

<div id="interactive-constraint-angles" class="interactive-demo"></div>

Here we have two parallel lines.

<div id="interactive-constraint-parallel" class="interactive-demo"></div>

We can add a constraint to make the two lines equal in length.

<div id="interactive-constraint-parallel-equal" class="interactive-demo"></div>

<!-- Show variety of constraint equations -->

### Graph Constructive

The dominant approach to constraint solving today is to analyze the constraint graph
to develop a solution plan of sub-problems, then recursively solve these sub-problems and
recombines sub-solutions until a complete solution is reached.

There are a variety of approaches to creating these constructive solvers.
Some reviews of decomposition approaches to constraint solving can be found below:

[_Decomposition Plans for Geometric Constraint Systems, Part I: Performance Measures for CAD (2001)_](https://pdf.sciencedirectassets.com/272313/1-s2.0-S0747717100X00107/1-s2.0-S0747717100904024/main.pdf?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEOP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDco%2BrLSn8O4HsaB%2FHSQsjLlfK0JH%2FjWSpqHmqdGXI06gIgAJbF%2FwNBVoPdczBOC7oOpi4PwD18dlTIRGU1OkErY7gqvAUI3P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAFGgwwNTkwMDM1NDY4NjUiDBgzYQ7Owpd7kFx%2FvyqQBUJVrJDKjI%2FNoJcGboyIKnAR%2Fh%2BY7D0bMyqMtw6HCxbTorudyzI9PqIqDomyHbxns46zkUmEPs%2BBLcVaT1YS9jc4B1cCgUw%2FN9ItdQF8wU%2BUtRSprcWQKqydri16pVkRNs1j4ioNXVOAxRfBbNVRd9NwctlLDMBfSFVr1PUQy1OriOZhkOSIfBz%2BB58bXKqSIFbRGsf%2B6te32oGaiGUNKw4TFeHsCN48%2BEVA6UXk4JuWrfXkVDD7LQkp8aS5%2BBi6WBHRmLEpTqhDH8q15JdWARsPSI0rgxN7LvsNCFJJc3bC7fHmuEVuSWNXN8MvSEhEJZhAOJi4MjhSM0SaR7jBnmAN4jPf2SN0qruuncINfolYVTN1GYfXIsIl2JQ%2FGaSir8Son3nnnZZv4hVm7KZfz%2FyM6KR99dY7EDPdQSCnO6rX8KcmmIM25F6fIcTFNCoZEN4nU6KwLFM0eb0z6e9aFsuhN6HU1Uej7%2FL%2Bsfo%2BekNpy1Q7eTA6DJj8%2BrNyUhQWISLsz9uKXLt%2BCcVu1c6%2F7HkrWqXeLxWfTOz6LFwPQvKDMvMSP9L%2F5Kp9nYEI%2BAiZhzJ%2F4gD8P3RdQ%2FQz5Dk%2BgJoMgenPGYWquk4FlCzOAWF%2FK02zXCJnE553EK0eLfQqxQsKP9hKq5Pv98tkI%2BEouwtch0sDcFsFDS9Gs0VpdFQckiJJg5TM%2BaGr2gFfIn4OJ%2B4uah%2FiMsEFeQ8M0FPKqlokwZhGGnB8foYXM2rApuddIUTamLroZdMsMyNHCQXrvC%2Fe9jcFoQ7rDqKSo6mHIvkSBfbJYY%2BCFzuNp1IoZu1w8qp6571YZEr2el1NGmdx9QZ8moac17v9K%2Bbm1jrdO0qzkFLzZfkjx%2FnfXlwtAnrOMNOc%2BbUGOrEB3oyOLdVF2oOjlqqFs78sMF1us2J04Ky5wi63liZFR%2BT8edED4HholALv260nZnUe0etr7SSxN9KGpj1jimXW8tHwTrzH6XAYWodac3yQFyQ0UbNMCv6yZsRHcf2NZm4LrhfYFrf8mDeZlWt93NotSfkAB9VZb08ZrFQux4VHY%2BIy4Ha7CskX2sEHfXQcmRiF3araS3jK6vT3GWxm1njk5qh%2BG24jlFb%2BM%2FuJqdyWFTYg&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240815T194328Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAQ3PHCVTYTANN3BVP%2F20240815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=1f75701ae01698dcb3377b4879a4255f4a476ad86d151872d240b52c75e0b9a6&hash=b9fa7422d25b1e64afea22828c64363b44152ab007d8e184903ec6779cd5e29e&host=68042c943591013ac2b2430a89b270f6af2c76d8dfd086a07176afe7c76c2c61&pii=S0747717100904024&tid=spdf-bd19b6c7-8852-48e4-ba72-41a5cc7cb518&sid=ddf20c839a8e25475e7b1ce805329bbc9ca0gxrqa&type=client&tsoh=d3d3LnNjaWVuY2VkaXJlY3QuY29t&ua=10145d07540204015803&rr=8b3bac7a286c8f6c&cc=us)

[_Decomposition Plans for Geometric Constraint Problems, Part II: New Algorithms (2001)_](https://www.cise.ufl.edu/~sitharam/pdfs/drtwo-final.pdf)

The two papers above are once agian from Hoffman and his collaborators Andrew Lomonosov and Meera Sitharam.
Sitharam is [currently at the University of Florida](https://www.cise.ufl.edu/~sitharam/) and did a lot of work developing
the Frontier Vertex Algorithm for constraint solving.
[According to Bettig and Hoffman](https://www.cs.purdue.edu/cgvlab/www/resources/papers/Bettig-Comp_and_Info_Sci_in_Eng-2011-Geometric_Constraint_Solving_In_Parametric_CAD.pdf) the Frontier Vertex Algorithm completes graph decomposition.

![](./assets/frontier-vertex-complete.png)

[An implementation of this algorithm from Sitharam's group can be found here](https://github.com/Geoplexity/Frontier).

Other reviews can be found in:

[_Decomposition of Geometric Constraint Systems: a Survey (2006)_](https://hal.science/hal-00481267/document)

[_Geometric Constraint Solver (2016)_](https://hal.science/tel-01402691/document)

Specific implementations of graph constructive solvers can be found in these papers:

[_A Graph-Constructive Approach to Solving Systems of Geometric Constraints (1997)_](https://dl.acm.org/doi/pdf/10.1145/248210.248223)

[_A 2D geometric constraint solver using a graph reduction method (2010)_](https://www.sciencedirect.com/science/article/abs/pii/S0965997810001006)

Hoffman and Joan-Arinyo claim that ["such solvers can be implemented with minimal effort"](https://pdf.sciencedirectassets.com/272313/1-s2.0-S0747717100X00533/1-s2.0-S0747717196900899/main.pdf?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEOP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIGRsWwBFOhdwUUTuJOLZNM%2F4LtgFcu%2FCjFXSnMAVVIb6AiEAo9gujeG0Hry7RD%2FoVquvI%2B26SLYY5LJKRG7LzwJHuYwqvAUI3P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAFGgwwNTkwMDM1NDY4NjUiDAYSZlH1rPKWkNZWbCqQBZJ%2BvIXZKvtisUlk6HgM5kn0nCaK4dN2erb3cSKGFPP5ZBBeHGULIVx8QXrTRu0zhLQqPlt7CSlm6YsUJ2gFMspYVSToGCL1twn4WRJ%2F8gX9QCdW9rOL%2BHME7w6dRWyHCBkEzVyIm2hnen1qh21pP1FtRNlMiWhOw4j2telxSwGqII6pVIza1Oq6hJK8RPw%2BTv7i3RJ%2F2yWfyn5C9vHq548o3Vl7QYzoO%2B%2B2NlXTKw9svPeP8W2hMZ%2FGImKV90jnx%2F8IGjtklUExaX02kKw%2FSwsAXojbEDsfXbNr%2BUBpcZhfEznjNs1P%2BC5potnkw4MJOq4bRtHA9TdZvGoo5Adiu7zuscSFZqo7AI76Hsg2vpw0NXTuyXHwngge8bYznS7BzIjpI7Tlzstuy6RdenCt%2BZ%2FAh6e35PGqvAB3RHmCSdcfCobEiateHUcPnza%2BZmhVthd7nO4f3f%2Fw5BE9%2B98LQYDWWUmlTyfLcGSYhtj%2BVkv%2FGjkb9pZ0r%2Bmyd9ky4QHzaf5TrsRyRnYMCO%2B0HvvmqQL8hKI%2ByENUNM3%2F0VsrEPS5d4fEbfouMewvbLVpktNzNwiUJyt2BBUIuao6X2DOP%2BYedH6XMZDDpFVqeIQyaJRY5FEMEjlMTEia6dRvo94Udh0nnh3L5algriBBFAF44hFe93OsdjLInRmrRwpZNeZXY6fmi%2FStbG502QOLgZp3Y6BGPK8HkTDbEIA0zS%2Fb7QOHX%2FF5rNcKr1epZbNysBI2SDD7Pq2L0C9%2BNu5aRvAKmk0ebRhuJ63a5BLbr0cDnzO1NuVjjR4UAbDqv1eW4XfqmXNHHJJYtbSJtumd63LU2ejGUxKBqQN7LU3Q%2FegoX13OFxYbJBP8tP2sGqvtKbbqMLmY%2BbUGOrEB6RQpl7KC%2FfJSCaCZtZhKudUAGfgiCK6siA75xcQJ5XWZlyXQCX27GzTjuZv7jD6ysBY0ipkkqV8wxSOTBppJGBDxsOngKwz0gYXHgTUO0D%2FNunAI2UX5BBgHtxjVvTQLDKW1IOVVbJUvwA%2FC362NT75gt7Z4TtvpnyJLva4pX1CN%2Flch8PMAY2xlDz3gYVf0LI7Ua6nQ12VO9FwJjXRC1EW5uwIUJZNzuUnX4CECXqQZ&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240815T194215Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAQ3PHCVTY7YWEE54E%2F20240815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=fbab48a533bec844cc11f086455532fc4263ce4d07436c9fce3841a89d5ad9a7&hash=5a436880572b02b9ff332475626ba08be8e080e387e434b86b6ccfbc61953866&host=68042c943591013ac2b2430a89b270f6af2c76d8dfd086a07176afe7c76c2c61&pii=S0747717196900899&tid=spdf-c6145acd-29f3-4e1e-9f81-e51e8cae6376&sid=ddf20c839a8e25475e7b1ce805329bbc9ca0gxrqa&type=client&tsoh=d3d3LnNjaWVuY2VkaXJlY3QuY29t&ua=10145d07540204030d52&rr=8b3baab059058f6c&cc=us).

![](./assets/minimal-effort.png)

And I took that personally. So let's do it...

As previously mentioned the first commerical constraint solver was developed by D-Cubed Ltd (once again based in Cambridge).
D-Cubed was founded by John Owen and based their solver 2D DCM on work developed by Owen
and described in his 1991 paper [_Algebraic Solution for Geometry from Dimensional Constraints_](https://papers.cumincad.org/data/works/att/9ad2.content.pdf)

The first step is to understand what exactly is a constraint graph.

Below depicts a triangle with a distance constraint on each edge and its corresponding constraint graph.

![](./assets/constraint-graph.png)

Owen depicts this constrained geometry and its corresponding constraint graph.

![](./assets/owen-constraint-graph.png)

The objective is to break the graph down into triangles which can be solved independently and recombined to form our target geometry.
A key insight is that under a certain set of constriants each sub-problem acts as a rigid body which can be repositioned by sliding or rotating it in space.

While analyzing our constraint graph we can also determine whether or not the system is well-constrained, under-constrained, or over-constrained.
If the system is unsolvable the graph can also help us identify which geometric entities or constraints cause issues.

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

A tree of this decomposition can be found in [this 2022 review paper](https://arxiv.org/pdf/2202.13795).

![](./assets/zou-graph-tree.png)

The final subgraphs are the leaves of the tree.

![](./assets/zou-leaves.png)

Let's figure out what this shape is.

There are 4 points and 4 lines.
Each point has a constraint between them which will be a distance constraint.
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

        // collect all adjacent nodes
        const adjacents = graph.edges
            .filter(edge => edge.source === nodeId || edge.target === nodeId)
            .map(edge => edge.source === nodeId ? edge.target : edge.source);

        adjacents.forEach(ni => {
            if (!visited[ni]) {
                parent[ni] = nodeId;
                childCount++;
                dfs(ni, d + 1);
                // check if the subtree rooted at ni has connection back to one of ancestors of nodeId
                if (low[ni] >= depth[nodeId]) {
                    isArticulation = true;
                }
                low[nodeId] = Math.min(low[nodeId], low[ni]);
            } else if (ni !== parent[nodeId]) {
                low[nodeId] = Math.min(low[nodeId], depth[ni]);
            }
        });

        // check articulation conditions
        if ((parent[nodeId] !== undefined && isArticulation) || (parent[nodeId] === undefined && childCount > 1)) {
            articulationPoints.add(nodeId);
        }
    }

    // initialize DFS from all unvisited nodes (handles disconnected graphs)
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

Notice how the virtual bond (dashed line) represents a relative distance between two points,
but we can't assign that distance and place the points until we can solve the relative distance with another subgraph of the system.

We can see our final geometry lines up with our original picture well.

![](./assets/final-construct.png)

These sub-systems can be solved in a variety of ways.
Owen solves them algebraically using quadratics.

[Previous: CAD History](./#cad-history)

[Next: B-Rep](./#brep)
