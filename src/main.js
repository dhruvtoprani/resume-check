import "./style.css";
import { inject } from "@vercel/analytics";

if (import.meta.env.PROD) {
  inject({
    beforeSend(event) {
      const url = new URL(event.url);
      url.search = "";
      url.hash = "";
      return { ...event, url: url.toString() };
    },
  });
}

import { extractPageText } from "./pdf-text.js";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { parserError, parserDiagnostic } from "./errors.js";
import {
  createIcons,
  FileCheck2,
  ArrowUpRight,
  Upload,
  ShieldCheck,
  Check,
  ArrowRight,
  FileText,
  Download,
  X,
  CircleAlert,
  Minus,
  LoaderCircle,
} from "lucide";
import { checkResume, pdfItemsToText, sample } from "./checks.js";
const icons = {
  FileCheck2,
  ArrowUpRight,
  Upload,
  ShieldCheck,
  Check,
  ArrowRight,
  FileText,
  Download,
  X,
  CircleAlert,
  Minus,
  LoaderCircle,
};
const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const linkedin = "https://www.linkedin.com/in/dhruvtoprani";
const connect = linkedin
  ? `<a class="connect" href="${linkedin}" target="_blank" rel="noopener noreferrer">Connect with me on LinkedIn ${icon("arrow-up-right")}</a>`
  : `<span class="byline">Made by Dhruv Toprani</span>`;
document.querySelector("#app").innerHTML = `
<header><a class="brand" href="/" aria-label="Resume Check home"><span class="brand-icon">${icon("file-check-2")}</span>resume<span class="brand-light">check</span><span class="beta">FREE TOOL</span></a><span class="header-note">A small tool for a real resume problem.</span></header>
<main><div class="workspace"><section id="intro"><div class="eyebrow">CHECK THE TEXT BEHIND YOUR RESUME</div><h1>Your resume has<br>a text version, too.</h1><p>A PDF can look right and still lose spaces or scramble letters when software reads it. See the extracted text and catch problems before you apply.</p><div class="extraction-example" aria-label="Example of a PDF extraction problem"><div><span>WHAT YOU SEE</span><p>Senior Software Engineer</p></div><div><span>WHAT CAN GET EXTRACTED</span><code>Senior<mark>Software</mark>Engineer</code><small>The spaces disappeared.</small></div></div></section>
<section class="upload-card" id="dropzone" aria-label="Upload your resume"><div class="upload-symbol">${icon("upload")}</div><h2>Check your file</h2><p>Drop your resume here for 8 text and formatting checks.</p><input id="file" type="file" accept=".pdf,.docx" hidden><button class="primary" id="choose">Choose your resume ${icon("arrow-right")}</button><span class="file-hint">PDF or DOCX · Up to 10 MB</span><div class="privacy">${icon("shield-check")} Stays on your device. Never uploaded or stored.</div></section>
<div id="error" class="error" role="alert" hidden></div><div class="try" id="try"><button id="sample">Try an example ${icon("arrow-up-right")}</button><span>No account needed.</span></div>
<section id="results" hidden aria-label="Resume check results" tabindex="-1"><div class="result-heading"><div><h2 id="result-title"></h2><p id="file-info"></p></div><button id="clear" class="secondary">${icon("x")} Start over</button></div><div class="result-grid"><section class="panel"><div class="panel-head"><h3>Checks <span id="count"></span></h3></div><div id="checks"></div></section><section class="panel text-panel"><div class="panel-head"><h3>Parsed text</h3><button class="icon-button" id="download" aria-label="Download extracted text" title="Download extracted text">${icon("download")}</button></div><pre id="extracted" tabindex="0" aria-label="Extracted resume text"></pre></section></div><p class="limits">Compare the text and reading order with your original. These checks aren’t an ATS score. No OCR; language checks focus on English.</p></section>
</div>
<aside class="inspiration"><section class="source-note"><div class="eyebrow">THE POST THAT STARTED THIS</div><h2>Inspired by <a href="https://www.linkedin.com/in/derek-homan/" target="_blank" rel="noopener noreferrer">Derek Homan ${icon("arrow-up-right")}</a></h2><a class="post-image" href="https://www.linkedin.com/feed/update/urn:li:activity:7507873916422561793/" target="_blank" rel="noopener" aria-label="Read Derek Homan’s original LinkedIn post"><img src="/inspired-by-derek-homan.png" alt="Derek Homan’s LinkedIn post describing missing spaces and unexpected letter casing in PDF resume extraction."></a><a class="post-credit" href="https://www.linkedin.com/feed/update/urn:li:activity:7507873916422561793/" target="_blank" rel="noopener noreferrer">Read the original post ${icon("arrow-up-right")}</a></section><section class="maker"><a class="maker-name" href="${linkedin}" target="_blank" rel="noopener noreferrer">Dhruv Toprani</a>${connect}</section></aside>
</main>`;
const $ = (s) => document.querySelector(s);
const refresh = () => createIcons({ icons });
refresh();
let currentText = "",
  currentName = "",
  busy = false,
  generation = 0;
function show(text, name, pages, isSample = false) {
  currentText = text;
  currentName = name;
  const checks = checkResume(text, pages);
  const issues = checks.filter((c) => c.status === "review").length;
  setResultsMode(true);
  $("#results").hidden = false;
  $("#result-title").textContent = issues
    ? `${issues} issue${issues === 1 ? "" : "s"} to review`
    : "Your text checks look good.";
  $("#file-info").textContent =
    `${isSample ? "Example · " : ""}${name} · ${pages.length} ${name.endsWith(".docx") ? "document" : pages.length === 1 ? "page" : "pages"} · ${text.trim().split(/\s+/).filter(Boolean).length} words`;
  $("#count").textContent =
    `${checks.filter((c) => c.status === "pass").length}/${checks.length} passed`;
  $("#checks").replaceChildren();
  for (const c of checks) {
    const d = document.createElement("details");
    d.className = `check ${c.status}`;
    d.open = c.status === "review";
    const s = document.createElement("summary");
    s.innerHTML = `<span class="status-icon">${icon(c.status === "pass" ? "check" : c.status === "review" ? "circle-alert" : "minus")}</span><span>${c.title}</span><span class="status-label">${c.status === "pass" ? "Passed" : c.status === "review" ? "Review" : "Manual"}</span>`;
    d.append(s);
    const body = document.createElement("div");
    body.className = "check-body";
    const p = document.createElement("p");
    p.textContent =
      c.status === "skip" && c.id === "headings"
        ? "No clear English headings detected. Review section labels manually."
        : c.detail;
    body.append(p);
    for (const evidence of c.evidence) {
      const code = document.createElement("code");
      code.textContent = evidence;
      body.append(code);
    }
    if (c.status === "review") {
      const fix = document.createElement("p");
      fix.className = "fix";
      fix.textContent = `Try this: ${c.fix}`;
      body.append(fix);
    }
    d.append(body);
    $("#checks").append(d);
  }
  $("#extracted").textContent = text || "[No readable text extracted]";
  refresh();
  $("#results").focus({ preventScroll: true });
}
function setBusy(v) {
  busy = v;
  $("#choose").disabled = v;
  $("#sample").disabled = v;
  $("#choose").innerHTML = v
    ? `${icon("loader-circle")} Reading your resume…`
    : `Choose your resume ${icon("arrow-right")}`;
  refresh();
}
async function load(file) {
  if (!file || busy) return;
  $("#error").hidden = true;
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "docx"].includes(ext))
    return error("Please choose a PDF or DOCX file.");
  if (file.size > 10 * 1024 * 1024)
    return error(
      "This file is larger than 10 MB. Please export a smaller version.",
    );
  if (!file.size)
    return error("This file is empty. Please choose another file.");
  const run = ++generation;
  setBusy(true);
  $("#results").hidden = true;
  currentText = "";
  let task;
  try {
    const data = await file.arrayBuffer();
    let pages;
    if (ext === "pdf") {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      task = pdfjs.getDocument({
        data,
        isEvalSupported: false,
        cMapUrl: "/pdf-assets/cmaps/",
        cMapPacked: true,
        standardFontDataUrl: "/pdf-assets/standard_fonts/",
        wasmUrl: "/pdf-assets/wasm/",
      });
      const pdf = await task.promise;
      if (pdf.numPages > 30)
        throw new Error(
          "This PDF has more than 30 pages. Please choose a shorter resume.",
        );
      pages = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        pages.push(await extractPageText(page));
      }
    } else {
      const mammoth = await import("mammoth/mammoth.browser");
      const result = await mammoth.default.extractRawText({
        arrayBuffer: data,
      });
      pages = [result.value];
    }
    if (run === generation) show(pages.join("\n\n"), file.name, pages);
  } catch (e) {
    if (run === generation) {
      error(parserError(e));
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "Error details";
      const diagnostic = document.createElement("pre");
      diagnostic.textContent = parserDiagnostic(e);
      details.append(summary, diagnostic);
      $("#error").append(details);
    }
  } finally {
    try {
      if (task) await task.destroy();
    } catch {
    } finally {
      setBusy(false);
      $("#file").value = "";
    }
  }
}

function setResultsMode(active) {
  for (const id of ["intro", "dropzone", "try"]) $("#" + id).hidden = active;
  $(".workspace").classList.toggle("has-results", active);
}
function error(message) {
  $("#error").textContent = message;
  $("#error").hidden = false;
}
$("#choose").onclick = () => $("#file").click();
$("#file").onchange = (e) => load(e.target.files[0]);
$("#sample").onclick = () => {
  $("#error").hidden = true;
  show(sample, "example-resume.pdf", [sample], true);
};
$("#clear").onclick = () => {
  generation++;
  currentText = "";
  currentName = "";
  $("#extracted").textContent = "";
  $("#checks").replaceChildren();
  $("#results").hidden = true;
  setResultsMode(false);
  $("#error").hidden = true;
  $("#file").value = "";
  $("#choose").focus();
};
$("#download").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([currentText], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = currentName.replace(/\.[^.]+$/, "") + "-parsed.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
for (const type of ["dragenter", "dragover"])
  $("#dropzone").addEventListener(type, (e) => {
    e.preventDefault();
    $("#dropzone").classList.add("dragging");
  });
for (const type of ["dragleave", "drop"])
  $("#dropzone").addEventListener(type, (e) => {
    e.preventDefault();
    $("#dropzone").classList.remove("dragging");
  });
$("#dropzone").addEventListener("drop", (e) => {
  if (e.dataTransfer.files.length > 1)
    return error("Please check one resume at a time.");
  load(e.dataTransfer.files[0]);
});
