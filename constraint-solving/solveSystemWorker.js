import { solveSystem } from "./solveSystem.js";

onmessage = e => {
	// self.postMessage("hello");
  	const { constraintEqs, variables, forwardSub } = e.data;
	const [satisfied, newVars] = solveSystem(constraintEqs, variables, forwardSub);
	postMessage({satisfied, newVars});
};

