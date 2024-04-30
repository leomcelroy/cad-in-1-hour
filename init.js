import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm'
import { initInteractiveConstraints } from "./demos/constraints.js";
import { init2DFREP } from "./demos/frep-2d.js";

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

const rawMarkdown = await fetch("./README.md").then(res => res.text());
const html = marked(rawMarkdown);

document.body.innerHTML = html;


// initInteractiveConstraints("#interactive-constraint");
init2DFREP("#frep", {
  sdfFuncString: `
      let rect = rectangleSDF(1.2, .2);
      let circle = circleSDF(.5);
      // circle = translate(circle, .2, .2);
      let final = union(rect, circle);

      return final(x, y);

  `
});

init2DFREP("#frep2", {
  sdfFuncString: `
      let rect = rectangleSDF(.2, 1.2);
      let circle = circleSDF(.54);
      // circle = translate(circle, .2+.3, .2);
      let final = union(rect, circle);

      return final(x, y);

  `
});

{
  const el = document.querySelector("#interactive-step");
  el.innerHTML = `<iframe src="https://step-test.glitch.me/" style="width:100vw;height:600px"></iframe>`
}




