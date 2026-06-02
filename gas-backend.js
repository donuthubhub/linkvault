// ===================================================================
//  LINK VAULT - Google Apps Script Backend  (v2)
//  Spreadsheet ID: 1dp3A15qAKmEtgoN8czOQOPBCLD91Ca2scRuvQY4YZyE
// ===================================================================

const SHEET_NAME  = "Links";
const CONFIG_NAME = "Config";
const HEADERS = ["ID", "URL", "Title", "Project", "Category", "Note", "Date Added", "Status", "History"];

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else {
    // Ensure new columns exist (Status, History) for older sheets
    const lastCol = sheet.getLastColumn();
    if (lastCol < HEADERS.length) {
      const have = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      for (let c = lastCol; c < HEADERS.length; c++) {
        sheet.getRange(1, c + 1).setValue(HEADERS[c]);
      }
    }
  }
  return sheet;
}

function getConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_NAME);
    sheet.appendRow(["Key", "Value"]);
    sheet.appendRow(["projects", JSON.stringify(["Aura","R1","Comisario","Final Pixel Studio","IR TH","IR SG","EVP"])]);
    sheet.appendRow(["categories", JSON.stringify(["Financial","Info","Social Media","Artwork","Clip"])]);
    sheet.appendRow(["archivedProjects", "[]"]);
    sheet.appendRow(["archivedCategories", "[]"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readConfig() {
  const sheet = getConfigSheet();
  const data = sheet.getDataRange().getValues();
  const cfg = {};
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    let val = data[i][1];
    if (!key) continue;
    try { val = JSON.parse(val); } catch (e) {}
    cfg[key] = val;
  }
  return cfg;
}

function doGet(e)  { return handleRequest(e, null); }
function doPost(e) { return handleRequest(e, JSON.parse(e.postData.contents)); }

function handleRequest(e, body) {
  const action = body ? body.action : e.parameter.action;
  try {
    let result;
    if      (action === "getLinks")   result = getLinks();
    else if (action === "saveLink")   result = saveLink(body.link);
    else if (action === "updateLink") result = updateLink(body.link);
    else if (action === "deleteLink") result = deleteLink(body.id);
    else if (action === "saveConfig") result = saveConfig(body.config);
    else result = { error: "Unknown action: " + action };
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getLinks() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  const links = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    links.push({
      id:        String(row[0]),
      url:       row[1],
      title:     row[2],
      project:   row[3],
      category:  row[4],
      note:      row[5],
      dateAdded: row[6],
      status:    row[7] || "active",
      history:   row[8] || "[]",
    });
  }
  return { links: links, config: readConfig() };
}

function rowMap(sheet) {
  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) map[String(data[i][0])] = i + 1; // sheet row number
  }
  return map;
}

function saveLink(link) {
  const sheet = getSheet();
  sheet.appendRow([
    link.id, link.url, link.title, link.project, link.category,
    link.note || "", link.dateAdded, link.status || "active", link.history || "[]",
  ]);
  return { success: true };
}

function updateLink(link) {
  const sheet = getSheet();
  const map = rowMap(sheet);
  const r = map[String(link.id)];
  if (!r) return { error: "ID not found" };
  sheet.getRange(r, 1, 1, HEADERS.length).setValues([[
    link.id, link.url, link.title, link.project, link.category,
    link.note || "", link.dateAdded, link.status || "active", link.history || "[]",
  ]]);
  return { success: true };
}

function deleteLink(id) {
  const sheet = getSheet();
  const map = rowMap(sheet);
  const r = map[String(id)];
  if (!r) return { error: "ID not found" };
  sheet.deleteRow(r);
  return { success: true };
}

function saveConfig(config) {
  const sheet = getConfigSheet();
  const data = sheet.getDataRange().getValues();
  const rowOf = {};
  for (let i = 1; i < data.length; i++) rowOf[data[i][0]] = i + 1;
  const keys = ["projects", "categories", "archivedProjects", "archivedCategories"];
  keys.forEach(function (k) {
    if (config[k] === undefined) return;
    const val = JSON.stringify(config[k]);
    if (rowOf[k]) sheet.getRange(rowOf[k], 2).setValue(val);
    else sheet.appendRow([k, val]);
  });
  return { success: true };
}
