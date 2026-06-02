// ═══════════════════════════════════════════════════
//  LINK VAULT — Google Apps Script Backend
//  Spreadsheet ID: 1dp3A15qAKmEtgoN8czOQOPBCLD91Ca2scRuvQY4YZyE
// ═══════════════════════════════════════════════════

const SHEET_NAME = "Links";

function getSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["ID", "URL", "Title", "Project", "Category", "Note", "Date Added"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  return handleRequest(e, null);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  return handleRequest(e, body);
}

function handleRequest(e, body) {
  const action = body ? body.action : e.parameter.action;

  try {
    let result;
    if (action === "getLinks")  result = getLinks();
    else if (action === "saveLink")   result = saveLink(body.link);
    else if (action === "deleteLink") result = deleteLink(body.id);
    else result = { error: "Unknown action: " + action };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getLinks() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { links: [] };
  const links = data.slice(1).map(row => ({
    id:        row[0],
    url:       row[1],
    title:     row[2],
    project:   row[3],
    category:  row[4],
    note:      row[5],
    dateAdded: row[6],
  }));
  return { links };
}

function saveLink(link) {
  const sheet = getSheet();
  sheet.appendRow([
    link.id,
    link.url,
    link.title,
    link.project,
    link.category,
    link.note || "",
    link.dateAdded,
  ]);
  return { success: true };
}

function deleteLink(id) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: "ID not found" };
}
