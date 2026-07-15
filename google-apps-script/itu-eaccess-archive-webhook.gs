var ITU_EACCESS_TARGET_SHEET = "Form responses 1";
var ITU_EACCESS_ALLOWED_SOURCE_SHEETS = ["STAFF", "STUDENT", "PELATIH", "TETAMU"];

function onEdit(e) {
  var sheet = e.range.getSheet();
  if (sheet.getName() !== ITU_EACCESS_TARGET_SHEET) return;

  var col = e.range.getColumn();
  var row = e.range.getRow();

  // Auto uppercase kecuali kolum A & B
  if (col !== 1 && col !== 2) {
    var editedValue = e.range.getValue();
    if (editedValue && typeof editedValue === "string") {
      e.range.setValue(editedValue.toUpperCase());
    }
  }

  addRowBorder(sheet, row);
}

function onFormSubmit(e) {
  var sheet = e.range.getSheet();
  if (sheet.getName() !== ITU_EACCESS_TARGET_SHEET) return;

  var row = e.range.getRow();
  var lastCol = sheet.getLastColumn();

  // Auto uppercase dari kolum C ke atas
  for (var col = 3; col <= lastCol; col++) {
    var cell = sheet.getRange(row, col);
    var value = cell.getValue();
    if (value && typeof value === "string") {
      cell.setValue(value.toUpperCase());
    }
  }

  addRowBorder(sheet, row);
}

function doPost(e) {
  try {
    var expectedSecret = PropertiesService
      .getScriptProperties()
      .getProperty("ITU_EACCESS_SYNC_SECRET");
    var providedSecret = (e.parameter && e.parameter.secret) || "";

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    var payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    var sourceSheetName = String(payload.sheetName || "").trim();
    var values = Array.isArray(payload.values) ? payload.values : null;

    if (ITU_EACCESS_ALLOWED_SOURCE_SHEETS.indexOf(sourceSheetName) === -1) {
      return jsonResponse({ ok: false, error: "Invalid sheetName" });
    }

    if (!values || values.length === 0) {
      return jsonResponse({ ok: false, error: "Missing values" });
    }

    var sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(ITU_EACCESS_TARGET_SHEET);

    if (!sheet) {
      return jsonResponse({
        ok: false,
        error: "Sheet not found: " + ITU_EACCESS_TARGET_SHEET,
      });
    }

    var rowValues = buildRawResponseRow(sourceSheetName, values);
    sheet.appendRow(rowValues);

    var row = sheet.getLastRow();
    formatArchiveRow(sheet, row, rowValues.length);

    return jsonResponse({
      ok: true,
      targetSheet: ITU_EACCESS_TARGET_SHEET,
      sourceSheetName: sourceSheetName,
      appendedColumns: rowValues.length,
      appendedRow: row,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function buildRawResponseRow(sourceSheetName, values) {
  if (sourceSheetName === "STAFF") {
    return buildStaffRawRow(values);
  }

  if (sourceSheetName === "STUDENT" || sourceSheetName === "PELATIH") {
    return buildPelatihRawRow(values);
  }

  if (sourceSheetName === "TETAMU") {
    return buildTetamuRawRow(values);
  }

  throw new Error("Invalid sheetName");
}

function buildStaffRawRow(values) {
  var hasCategoryInPayload = String(values[2] || "").toUpperCase() === "STAFF";
  var staffName = hasCategoryInPayload ? values[3] : values[2];
  var staffLocation = hasCategoryInPayload ? values[4] : values[3];
  var status = hasCategoryInPayload ? values[5] : values[4];

  return [
    values[0] || "", // Timestamp
    values[1] || "", // Email address
    "STAFF",         // KATEGORI
    staffName || "", // NAMA STAFF
    staffLocation || "", // LOKASI STAFF
    "",              // NAMA PELATIH
    "",              // LOKASI PELATIH
    "",              // NAMA TETAMU
    "",              // DARI MANA
    "",              // TUJUAN
    status || "",    // STATUS
  ];
}

function buildPelatihRawRow(values) {
  return [
    values[0] || "", // Timestamp
    values[1] || "", // Email address
    "PELATIH",       // KATEGORI
    "",              // NAMA STAFF
    "",              // LOKASI STAFF
    values[2] || "", // NAMA PELATIH
    values[3] || "", // LOKASI PELATIH
    "",              // NAMA TETAMU
    "",              // DARI MANA
    "",              // TUJUAN
    values[4] || "", // STATUS
  ];
}

function buildTetamuRawRow(values) {
  return [
    values[0] || "", // Timestamp
    values[1] || "", // Email admin/recorder
    "TETAMU",        // KATEGORI
    "",              // NAMA STAFF
    "",              // LOKASI STAFF
    "",              // NAMA PELATIH
    "",              // LOKASI PELATIH
    values[2] || "", // NAMA TETAMU
    values[3] || "", // DARI MANA
    values[4] || "", // TUJUAN
    values[5] || "", // STATUS
  ];
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatArchiveRow(sheet, row, colCount) {
  var range = sheet.getRange(row, 1, 1, colCount);
  var values = range.getValues()[0].map(function(value, index) {
    // Jangan uppercase timestamp dan email
    if (index === 0 || index === 1) return value;
    if (value && typeof value === "string") return value.toUpperCase();
    return value;
  });

  range.setValues([values]);
  range.setBorder(true, true, true, true, true, true);
}

function addRowBorder(sheet, row) {
  var range = sheet.getRange(row, 1, 1, 11);
  range.setBorder(true, true, true, true, true, true);
}

function applyBordersToAll() {
  var sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(ITU_EACCESS_TARGET_SHEET);

  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var range = sheet.getRange(2, 1, lastRow - 1, 11);
  range.setBorder(true, true, true, true, true, true);
}
