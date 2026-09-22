import test from "node:test";
import assert from "node:assert/strict";
import { parserError, parserDiagnostic } from "./errors.js";
test("worker mismatch is not labelled a corrupt resume", () =>
  assert.match(
    parserError({
      name: "UnknownErrorException",
      message: "The API version does not match the Worker version",
    }),
    /reader couldn’t load/,
  ));
test("password and invalid PDF get distinct guidance", () => {
  assert.match(parserError({ name: "PasswordException" }), /password/);
  assert.match(parserError({ name: "InvalidPDFException" }), /valid PDF/);
});
test("unexpected compatibility failures do not blame the file", () =>
  assert.match(
    parserError(new TypeError("Unsupported API")),
    /file may be valid/,
  ));
test("diagnostics are bounded and safe to display as text", () =>
  assert.equal(parserDiagnostic(new Error("x".repeat(900))).length, 500));
