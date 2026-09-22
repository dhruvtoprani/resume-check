import test from "node:test";
import assert from "node:assert/strict";
import { extractPageText } from "./pdf-text.js";
test("extracts text without ReadableStream async iteration and preserves chunk boundaries", async () => {
  let released = false;
  const chunks = [
    { value: { items: [{ str: "Software", hasEOL: false }] } },
    {
      value: {
        items: [
          { str: "engineer", hasEOL: true },
          { str: "Next", hasEOL: false },
        ],
      },
    },
    { done: true },
  ];
  const page = {
    streamTextContent: () => ({
      getReader: () => ({
        read: async () => chunks.shift(),
        releaseLock: () => {
          released = true;
        },
      }),
    }),
  };
  assert.equal(await extractPageText(page), "Softwareengineer\nNext");
  assert.equal(released, true);
});
test("releases the reader when PDF extraction fails", async () => {
  let released = false;
  const page = {
    streamTextContent: () => ({
      getReader: () => ({
        read: async () => {
          throw Error("bad stream");
        },
        releaseLock: () => {
          released = true;
        },
      }),
    }),
  };
  await assert.rejects(() => extractPageText(page), /bad stream/);
  assert.equal(released, true);
});
