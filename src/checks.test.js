import test from "node:test";
import assert from "node:assert/strict";
import { checkResume, pdfItemsToText, sample } from "./checks.js";
const status = (text, id, pages) =>
  checkResume(text, pages).find((c) => c.id === id).status;
const good =
  "Alex Morgan\nalex@example.com\nEXPERIENCE\nSoftware engineer with ten years of experience building accessible applications.\nEDUCATION\nExample University";
test("ordinary resume passes the checks", () =>
  assert.ok(checkResume(good).every((c) => c.status === "pass")));
test("reproduces joined words and small-cap extraction issue", () => {
  assert.equal(status(sample, "spacing"), "review");
  assert.equal(status(sample, "case"), "review");
});
test("all-caps headings are not incorrectly flagged", () =>
  assert.equal(status(good + "\nSENIOR SOFTWARE ENGINEER", "case"), "pass"));
test("scanned and partly scanned files are flagged", () => {
  assert.equal(status("", "text"), "review");
  assert.equal(status(good, "pages", [good, ""]), "review");
});
test("broken encoding detected", () =>
  assert.equal(status(good + "\nBad\uFFFDtext", "characters"), "review"));
test("letter-spaced heading detected", () =>
  assert.equal(status(good + "\nE X P E R I E N C E", "letters"), "review"));
test("long URL is not considered a glued word", () =>
  assert.equal(
    status(
      good + "\nhttps://example.com/averylongrepositoryorprofileidentifier",
      "spacing",
    ),
    "pass",
  ));
test("email absence flagged", () =>
  assert.equal(
    status(good.replace("alex@example.com", "Contact me"), "email"),
    "review",
  ));
test("PDF item assembly does not repair missing spaces", () =>
  assert.equal(
    pdfItemsToText([
      { str: "Software", hasEOL: false },
      { str: "engineer", hasEOL: true },
      { str: "Next", hasEOL: false },
    ]),
    "Softwareengineer\nNext",
  ));
test("no extracted text skips dependent tests", () =>
  assert.equal(status("", "spacing"), "skip"));
