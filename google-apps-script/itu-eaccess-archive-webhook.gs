const ITU_EACCESS_ALLOWED_SHEETS = new Set(["STAFF", "STUDENT", "TETAMU"]);

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const expectedSecret = PropertiesService
      .getScriptProperties()
      .getProperty("ITU_EACCESS_SYNC_SECRET");
    const providedSecret = (e.parameter && e.parameter.secret) || "";

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    const sheetName = String(payload.sheetName || "").trim();
    const values = Array.isArray(payload.values) ? payload.values : null;

    if (!ITU_EACCESS_ALLOWED_SHEETS.has(sheetName)) {
      return jsonResponse({ ok: false, error: "Invalid sheetName" });
    }

    if (!values || values.length === 0) {
      return jsonResponse({ ok: false, error: "Missing values" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ ok: false, error: "Sheet not found: " + sheetName });
    }

    sheet.appendRow(values);
    return jsonResponse({ ok: true, sheetName: sheetName, appendedColumns: values.length });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}
