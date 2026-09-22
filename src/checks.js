export function checkResume(text, pages = [text]) {
  const meaningful = text.replace(/\s/g, "").length;
  const tokens = text.split(/\s+/).filter(Boolean);
  const long = tokens.filter(
    (t) => !/[@/:\\]/.test(t) && /[a-zA-Z]{28,}/.test(t),
  );
  const caseErrors = tokens.filter((t) => /[A-Z]{3,}[a-z][A-Z]{3,}/.test(t));
  const broken = [
    ...text.matchAll(/[\uFFFD\u0000-\u0008\u000B\u000E-\u001F\uE000-\uF8FF]/g),
  ];
  const spaced = text.match(/(?:\b[A-Za-z] ){5,}[A-Za-z]\b/g) || [];
  const emptyPages = pages
    .map((p, i) => (p.replace(/\s/g, "").length < 20 ? i + 1 : null))
    .filter(Boolean);
  const english =
    /\b(?:experience|education|skills|projects|summary|employment|work|university)\b/i.test(
      text,
    );
  const sections = text
    .split(/\n/)
    .filter((l) =>
      /^\s*(?:(?:professional|work|relevant)\s+)?(?:experience|education|skills|projects|summary|employment|certifications|technical skills)\s*[:|]?\s*$/i.test(
        l,
      ),
    );
  const test = (
    id,
    title,
    fail,
    detail,
    fix,
    evidence = [],
    eligible = true,
  ) => ({
    id,
    title,
    status: eligible ? (fail ? "review" : "pass") : "skip",
    detail: eligible
      ? detail
      : "Run this check after readable text is available.",
    fix,
    evidence: evidence.slice(0, 3),
  });
  return [
    test(
      "text",
      "Readable text",
      meaningful < 80,
      meaningful < 80
        ? "Very little readable text was extracted."
        : "Your file contains selectable, extractable text.",
      "Export directly from your document editor as PDF. For scanned pages, apply OCR and check the resulting text.",
    ),
    test(
      "pages",
      "Text on every page",
      emptyPages.length > 0,
      emptyPages.length
        ? `Little or no text on page${emptyPages.length > 1 ? "s" : ""} ${emptyPages.join(", ")}.`
        : "Each page contains readable text.",
      "Remove unintended blank pages or apply OCR to scanned pages. A page can contain an image that this check cannot read.",
    ),
    test(
      "spacing",
      "Word spacing",
      long.length > 0,
      long.length
        ? "Unusually long strings may contain words joined together."
        : "No suspiciously long joined words found.",
      "Replace decorative fonts, add real spaces, and export again. Compare these strings with your original document.",
      long,
      meaningful >= 80,
    ),
    test(
      "characters",
      "Character encoding",
      broken.length > 0,
      broken.length
        ? `${broken.length} replacement, control, or private-use character(s) found.`
        : "No common broken-encoding characters found.",
      "Use a standard font and re-export with fonts embedded. Replace icons used in place of essential contact text.",
      [],
      meaningful >= 80,
    ),
    test(
      "case",
      "Unexpected letter case",
      caseErrors.length > 0,
      caseErrors.length
        ? "Lowercase letters appear inside uppercase words."
        : "No unusual lowercase letters inside uppercase words.",
      "Check the highlighted text against the original. Disable small caps or change the font if the extracted case is wrong.",
      caseErrors,
      meaningful >= 80,
    ),
    test(
      "letters",
      "Split-up letters",
      spaced.length > 0,
      spaced.length
        ? "Some words appear to be separated into individual letters."
        : "No runs of individually spaced letters found.",
      "Remove letter spacing or use a standard font. Type headings as normal words rather than spacing each letter.",
      spaced,
      meaningful >= 80,
    ),
    test(
      "email",
      "Contact email",
      !/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text),
      /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text)
        ? "An email address is visible in the extracted text."
        : "No email address was found in the extracted text.",
      "Include your email as plain text, not just an icon, image, or hyperlink label.",
      [],
      meaningful >= 80,
    ),
    test(
      "headings",
      "Section headings",
      !sections.length,
      sections.length
        ? `${sections.length} recognizable English section heading(s) found.`
        : "No standard English section headings found.",
      "If this resume is in English, use clear standalone headings such as Experience, Education, and Skills. Other languages need manual review.",
      [],
      meaningful >= 80 && english,
    ),
  ];
}
export function pdfItemsToText(items) {
  // Preserve the parser’s strings and line endings. Never insert spaces to hide defects.
  return items
    .filter((item) => "str" in item)
    .map((item) => item.str + (item.hasEOL ? "\n" : ""))
    .join("");
}
export const sample = `ALEX MORGAN\nalex.morgan@example.com • Portland, OR\n\nEXPERIENCE\nSENiORSOFTWAREENGiNEER\nNorthstar Studio | 2021–Present\nSoftwareengineerwith10yearsofexperiencebuildingfullstackapplications\nBuilt accessible web applications for a team of 25 designers and engineers.\nReduced page load time by 35% through performance improvements.\n\nEDUCATION\nB.S. Computer Science, Example University\n\nSKILLS\nJavaScript, TypeScript, React, Python, SQL`;
