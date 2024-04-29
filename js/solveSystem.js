import { evaluate } from './evaluate.js';
import { linearAlgebra } from '../libs/linear-algebra.js';
import { lusolve } from "./lusolve.js";

const Matrix = linearAlgebra().Matrix;

const double = x => [x.val, x.der];

const parseComb = eqs => {
  eqs = eqs.map(eq => `(${eq})*(${eq})`);
  return eqs.join("+");
}

const totalError = val_ders => val_ders[0].flat().reduce((acc, cur) => acc + cur ** 2, 0) / 2;

const get_val_ders = (eqs, variables) => eqs.reduce((acc, cur) => {
  let { val, der } = evaluate(cur, variables);
  return [ [...acc[0], [val] ], [...acc[1], der] ]
}, [ [], [] ]);

function levenbergMarquardt(
  eqs,
  variables, 
  {
    ogLambda = 10,
    lambdaUp = 10,
    lambdaDown = 10,
    epsilon = 0.00001,
    fast = false
  } = {}
) {
  let lambda = ogLambda;
  let updateJacobian = true;
  let converged = false;

  let transJacobian,
    hessianApprox,
    residual,
    jacobian,
    weighted,
    gradiant,
    new_val_ders,
    costGradiant,
    a,
    b,
    deltas,
    error,
    newVariables,
    new_error,
    ds;


  let val_ders = get_val_ders(eqs, variables);

  while (!converged) {

    if (updateJacobian) {
      [residual, jacobian] = val_ders.map(x => new Matrix(x));
      transJacobian = jacobian.trans();
      hessianApprox = transJacobian.dot(jacobian);
      updateJacobian = false;
    }

    weighted = Matrix.scalar(hessianApprox.rows, lambda)
    gradiant = hessianApprox.plus(weighted);
    costGradiant = transJacobian.dot(residual);

    a = gradiant.toArray();
    b = costGradiant.toArray();
    deltas = lusolve(a, b, fast);

    error = totalError(val_ders);

    newVariables = {};
    Object.keys(variables).forEach((key, index) => {
      newVariables[key] = variables[key] - deltas[index];
    });

    new_val_ders = get_val_ders(eqs, newVariables);

    new_error = totalError(new_val_ders);
    ds = new_val_ders[1].flat();

    converged = (new_error < epsilon) || ds.every(der => Math.abs(der) < epsilon) || Math.abs(error - new_error) < epsilon;

    if (new_error < error) {
      lambda = lambda / lambdaDown;
      variables = newVariables;
      val_ders = new_val_ders;
      updateJacobian = true;
    } else {
      lambda = lambda * lambdaUp;
    }
  }

  return newVariables;
}

function splitAt (index, array) {
  let front = array.slice(0, index);
  let back = array.slice(index);
  return [front, back];
}

function solveSystem(eqns, vars, {
  forwardSubs = {},
  epsilon = 0.00001
} = {}) {
  Object.entries(forwardSubs).forEach(([variable, value]) => {
    eqns = eqns.map(eq => eq.replaceAll(variable, value));
  })

  if (eqns.length < 1) return [
    [], vars
  ];

  let varsPrime;
  try {
    varsPrime = levenbergMarquardt(eqns, vars, {
      epsilon
    });

    Object.entries(forwardSubs).forEach(([variable, value]) => {
      if (typeof value === "string") varsPrime[variable] = varsPrime[value];
      else varsPrime[variable] = value;
    })

  } catch (err) {
    console.log("Erred during levenbergMarquardt, maybe undefined in jacobian:", err);
    varsPrime = vars;
  }

  // ------------ CHECK SATISFACTION ------------
  let scores = eqns.map(eq => evaluate(eq, varsPrime).val ** 2);
  let satisfied = scores.map(score => score < Math.sqrt(epsilon));

  let result = [];
  if (satisfied.every(constraint => constraint === true)) {
    result = [satisfied, varsPrime];
  } else {
    let indices = [];
    satisfied.forEach((constraint, index) => {
      if (constraint === false) {
        indices.push(index)
      }
    })
    let [front, back] = splitAt(indices[0], eqns);
    let newEqs = front.concat(back.slice(1));

    let [satisfiedPrime, out] = solveSystem(newEqs, varsPrime, {
      forwardSubs,
      epsilon
    });

    let [a, b] = splitAt(indices[0], satisfiedPrime);

    result = [a.concat([false]).concat(b), out];
  }



  return result;
}

export {
  solveSystem
}