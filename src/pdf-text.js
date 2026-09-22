import { pdfItemsToText } from "./checks.js";
// Use the reader API directly: Safari versions without stream async iteration
// cannot run PDF.js getTextContent() (mozilla/pdf.js#21557).
export async function extractPageText(page) {
  const reader = page.streamTextContent().getReader();
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(pdfItemsToText(value.items));
    }
    return chunks.join("");
  } finally {
    reader.releaseLock();
  }
}
