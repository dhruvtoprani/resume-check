export function parserError(error) {
  const name = error?.name || "Error";
  const message = error?.message || "";
  if (name === "PasswordException")
    return "This PDF is password protected. Save an unlocked copy and try again.";
  if (name === "InvalidPDFException")
    return "This file could not be recognized as a valid PDF. Open it in your PDF viewer, then export a fresh PDF and try again.";
  if (message.includes("30 pages")) return message;
  if (
    /worker|dynamically imported|module script|fetch|network|API version/i.test(
      message,
    )
  )
    return "The PDF reader couldn’t load correctly. Refresh this page and try again. If it still fails, try another browser or temporarily disable content blockers for this site. Your file has not been uploaded.";
  if (/zip|central directory|end of data/i.test(message))
    return "This file could not be read as a Word document. Open it in Word and save a new .docx copy.";
  return "The reader hit an unexpected compatibility error. Your file may be valid. Try an up-to-date Chrome, Edge, Firefox, or Safari browser. If it still fails, share the diagnostic below so we can investigate.";
}
export function parserDiagnostic(error) {
  return `${error?.name || "Error"}: ${error?.message || "No additional details available."}`.slice(
    0,
    500,
  );
}
