import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm'
import { initInteractiveConstraints } from "./demos/constraints.js";

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

const el = document.querySelector("#interactive-constraint");
initInteractiveConstraints(el);





