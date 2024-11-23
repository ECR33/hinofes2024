function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

function doGet(e) {
  let page = e.parameter.page;
  console.log("e", e);
  if (!page) {
    const template = HtmlService.createTemplateFromFile('index');
    const htmlOutput = template.evaluate();
    htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    return htmlOutput;
  }
  if (page == "payment") {
    const template = HtmlService.createTemplateFromFile('payment');
    const htmlOutput = template.evaluate();
    htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    return htmlOutput;
  }
  if (page == "delivery") {
    const item = e.parameter.item;
    const template = HtmlService.createTemplateFromFile('delivery');
    template.item = item;
    const htmlOutput = template.evaluate();
    htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    return htmlOutput;
  }
  if (page == "dashboard") {
    const htmlOutput = HtmlService.createTemplateFromFile('dashboard').evaluate();
    htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    return htmlOutput;
  }
  if (page == "api") {
    let data;
    if (e.parameter.f == "getMemberList") {
      data = getMemberList(e.parameter.keyword);
    } else if (e.parameter.f == "getNewMemberList") {
      data = getNewMemberList(e.parameter.keyword);
    } else if (e.parameter.f == "getPrice") {
      data = getPrice();
    } else if (e.parameter.f == "dashboard") {
      data = getDashboardData();
    } else if (e.parameter.f == "dashboardEx") {
      data = getDashboardDataEx();
    } else {
      data = { name: "test name", data: "test data" };
    }
    let payload = JSON.stringify(data);
    let output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(payload);
    return output;
  }
  if (page == "qr") {
    let blob = createQrCode(getAppUrl());
    let contenttype = blob.getContentType();
    const content = blob.getBytes();
    const encodedContent = Utilities.base64Encode(content);
    let imgsrc = "data:" + contenttype + ";base64, " + encodedContent
    let data = { "name": "QR", "id": 1, "img": imgsrc };
    data.hinodog = hinodog();
    data.yakisoba = yakisoba();
    data.onigiri = onigiri();
    data.okashi = okashi();
    data.volunteer = volunteer();
    let output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(data));
    return output;
  }
}

function doPost(e) {
  console.log("e", e);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("log");

  sheet.getRange("1:1").insertCells(SpreadsheetApp.Dimension.ROWS);
  sheet.getRange(1, 1).setValue((new Date).toLocaleString('ja-JP'));
  sheet.getRange(1, 2).setValue(e);
  sheet.getRange(1, 3).setValue(e.postData.contents);

  let requestData = e.postData.contents;
  let params = parseUrlEncoded(requestData);

  sheet.getRange(1, 4).setValue(params);

  let member = updateMember(params);
  let payload = JSON.stringify(member);
  sheet.getRange(1, 5).setValue(member);

  let output = ContentService.createTextOutput(payload);
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(payload);
  return output;
}

function parseUrlEncoded(data) {
  var result = {};
  var pairs = data.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return result;
}

function getDashboardDataEx() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("サマリ");
  const values = sheet.getDataRange().getValues();
  const labels = values.shift();

  const records = [];
  for (const value of values) {
    const record = {};
    labels.forEach((label, index) => {
      record[label] = value[index];
    })
    records.push(record);
  }
  return records;
}

function getDashboardData() {
  let prices = getPrice();
  up_hinodog = prices["食券①ひのドッグ"]
  up_yakishoba = prices["食券②やきそば"]
  up_onigiri = prices["食券③紅白おむすびセット"]
  up_okashi = prices["食券④お菓子セット"]

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("注文一覧");
  const values = sheet.getDataRange().getValues();
  const labels = values.shift();

  let hinodog = 0;
  let yakishoba = 0;
  let onigiri = 0;
  let okashi = 0;
  let volunteer = 0;
  let total = 0;
  let payed = 0;
  let mp_hinodog = 0;
  let mp_yakishoba = 0;
  let mp_onigiri = 0;
  let mp_okashi = 0;
  let mt_hinodog = 0;
  let mt_yakishoba = 0;
  let mt_onigiri = 0;
  let mt_okashi = 0;
  let m_total = 0;
  let m_payed = 0;


  for (const value of values) {
    if (value[15]) {
      hinodog += value[8];
      yakishoba += value[9];
      onigiri += value[10];
      okashi += value[11];
      if (value[12]) {
        volunteer += 1;
      }
      total += 1;
      if (value[13]) {
        payed += 1;
        mp_hinodog += value[8];
        mp_yakishoba += value[9];
        mp_onigiri += value[10];
        mp_okashi += value[11];
      }
    }
  }

  mp_hinodog = mp_hinodog * up_hinodog;
  mp_yakishoba = mp_yakishoba * up_yakishoba;
  mp_onigiri = mp_onigiri * up_onigiri;
  mp_okashi = mp_okashi * up_okashi;

  mt_hinodog = hinodog * up_hinodog;
  mt_yakishoba = yakishoba * up_yakishoba;
  mt_onigiri = onigiri * up_onigiri;
  mt_okashi = okashi * up_okashi;

  m_total = mt_hinodog + mt_yakishoba + mt_onigiri + mt_okashi;
  m_payed = mp_hinodog + mp_yakishoba + mp_onigiri + mp_okashi;

  const ret = {
    hinodog: hinodog,
    yakishoba: yakishoba,
    onigiri: onigiri,
    okashi: okashi,
    volunteer: volunteer,
    total: total,
    payed: payed,
    mp_hinodog: mp_hinodog,
    mp_yakishoba: mp_yakishoba,
    mp_onigiri: mp_onigiri,
    mp_okashi: mp_okashi,
    mt_hinodog: mt_hinodog,
    mt_yakishoba: mt_yakishoba,
    mt_onigiri: mt_onigiri,
    mt_okashi: mt_okashi,
    m_total: m_total,
    m_payed: m_payed,
  }
  console.log('dashboard', ret);
  return ret;
}

function getMemberList(keyword) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("注文一覧");
  const values = sheet.getDataRange().getValues();
  const labels = values.shift();

  filtered_values = values.filter(value => {
    return value[4].includes(keyword) & value[15];
  })
  console.log("values", filtered_values);

  const records = [];
  for (const value of filtered_values) {
    const record = {};
    value[8] = value[8] == 1;
    value[9] = value[9] == 1;
    value[10] = value[10] == 1;
    value[11] = value[11] == 1;
    labels.forEach((label, index) => {
      record[label] = value[index];
    })
    records.push(record);
  }
  return records;
}

function getNewMemberList(keyword) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("会員一覧_FY2024");
  const values = sheet.getDataRange().getValues();
  const labels = values.shift();

  filtered_values = values.filter(value => {
    return value[5].includes(keyword);
  })

  const records = [];
  for (const value of filtered_values) {
    // id	年	組	氏名	かな	会員	記入氏名	未就学児	食券①ひのドッグ	食券②やきそば	食券③紅白おむすびセット	食券④お菓子セット	生徒ボランティア	集金
    const record = {};

    record.id = Utilities.getUuid();
    record["年"] = value[0];
    record["組"] = value[1];
    record["氏名"] = value[3];
    record["かな"] = value[5];
    if (value[8] == "非") {
      record["会員"] = false;
    } else {
      record["会員"] = true;
    }
    record["記入氏名"] = value[3];
    record["未就学児"] = "";
    record["食券①ひのドッグ"] = 0;
    record["食券②やきそば"] = 0;
    record["食券③紅白おむすびセット"] = 0;
    record["食券④お菓子セット"] = 0;
    record["生徒ボランティア"] = false;
    record["集金"] = false;


    records.push(record);
  }
  console.log(records);
  return records;
}

function getPrice() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("商品一覧");
  const values = sheet.getDataRange().getValues();
  const labels = values.shift();

  const record = {};
  for (const value of values) {
    let name;
    let price;
    labels.forEach((label, index) => {
      if (label == '品名') {
        name = value[index];
        console.log('品名', name);
      }
      if (label == '単価') {
        price = value[index];
        console.log('単価', price);
      }
    })
    record[name] = price;
    console.log('record', record);
  }
  return record;
}

function updateCol(sheet, targetRow, colName, member) {
  const targetCol = sheet.getRange('1:1').createTextFinder(colName).matchEntireCell(true).findNext().getColumn();
  sheet.getRange(targetRow, targetCol).setValue(member[colName]);
  console.log(colName, member[colName]);
}

function updateMember(member) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("注文一覧");

  if (member.isDeliverMode) {
    // 商品提供モード
    const targetRow = sheet.getRange('A:A').createTextFinder(member.id).matchEntireCell(true).findNext().getRow();
    const col_name = member['col_name']
    member[col_name] = member.delivered
    updateCol(sheet, targetRow, col_name, member);

  } else {
    // 注文更新・支払いモード
    member['食券①ひのドッグ'] = member['食券①ひのドッグ'] == 'true' ? 1 : 0
    member['食券②やきそば'] = member['食券②やきそば'] == 'true' ? 1 : 0
    member['食券③紅白おむすびセット'] = member['食券③紅白おむすびセット'] == 'true' ? 1 : 0
    member['食券④お菓子セット'] = member['食券④お菓子セット'] == 'true' ? 1 : 0
    member['生徒ボランティア'] = member['生徒ボランティア'] == 'true' ? true : false
    member['集金'] = member['集金'] == 'true' ? true : false

    const targetRow = sheet.getRange('A:A').createTextFinder(member.id).matchEntireCell(true).findNext().getRow();
    // 未就学児	食券①ひのドッグ	食券②やきそば	食券③紅白おむすびセット	食券④お菓子セット	生徒ボランティア	集金
    updateCol(sheet, targetRow, '未就学児', member);
    updateCol(sheet, targetRow, '食券①ひのドッグ', member);
    updateCol(sheet, targetRow, '食券②やきそば', member);
    updateCol(sheet, targetRow, '食券③紅白おむすびセット', member);
    updateCol(sheet, targetRow, '食券④お菓子セット', member);
    updateCol(sheet, targetRow, '生徒ボランティア', member);
    updateCol(sheet, targetRow, '集金', member);

  }

  return member;
}

function appendMember(member) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("注文一覧");
  const targetRow = sheet.getRange('A:A').createTextFinder(member.id).matchEntireCell(true).findNext().getRow();

}

function createQrCode(code_data) {
  const qrApiUrl = 'https://qrcode.tec-it.com/API/QRCode?data=';
  // 'https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl='
  let url = qrApiUrl + code_data;
  let option = {
    method: "get",
    muteHttpExceptions: true
  };
  let ajax = UrlFetchApp.fetch(url, option);
  console.log(ajax.getBlob())
  return ajax.getBlob();
}

function hinodog() {
  return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc3OSIKICAgd2lkdGg9IjI0Ny4wMjIzMSIKICAgaGVpZ2h0PSIyMTQuODczNjciCiAgIHZpZXdCb3g9IjAgMCAyNDcuMDIyMzEgMjE0Ljg3MzY3IgogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzCiAgICAgaWQ9ImRlZnM4MyI+CiAgICA8Y2xpcFBhdGgKICAgICAgIGNsaXBQYXRoVW5pdHM9InVzZXJTcGFjZU9uVXNlIgogICAgICAgaWQ9ImNsaXBQYXRoOTUiPgogICAgICA8cGF0aAogICAgICAgICBkPSJNIDAsMzAwIEggMzAwIFYgMCBIIDAgWiIKICAgICAgICAgaWQ9InBhdGg5MyIgLz4KICAgIDwvY2xpcFBhdGg+CiAgPC9kZWZzPgogIDxnCiAgICAgaWQ9Imc4NyIKICAgICB0cmFuc2Zvcm09Im1hdHJpeCgxLjMzMzMzMzMsMCwwLC0xLjMzMzMzMzMsLTYzLjE3NDcxMywzMTkuNTMxMzYpIj4KICAgIDxnCiAgICAgICBpZD0iZzg5IgogICAgICAgdHJhbnNmb3JtPSJyb3RhdGUoMzcuNDg1ODgsMTUwLjAwMDAxLDE1MC4wMDAxNikiPgogICAgICA8ZwogICAgICAgICBpZD0iZzkxIgogICAgICAgICBjbGlwLXBhdGg9InVybCgjY2xpcFBhdGg5NSkiPgogICAgICAgIDxnCiAgICAgICAgICAgaWQ9Imc5NyIKICAgICAgICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMzkuMTMzOCwxNzAuOTA0MykiPgogICAgICAgICAgPHBhdGgKICAgICAgICAgICAgIGQ9Im0gMCwwIGMgLTMuOTgsLTEuNjUgLTguMzc3LC0wLjg2OSAtMTIuNjMxLC0wLjExNCAtMy4zMTcsMC41ODggLTYuNDUxLDEuMTQ2IC04Ljc1MSwwLjQyIC0yLjMzLC0wLjczNSAtNC41OTMsLTMuMDAxIC02Ljk4NywtNS40MDEgLTMuMDM4LC0zLjA0MyAtNi4xNzksLTYuMTg5IC0xMC4zNTMsLTcuMTE0IC00LjE5NiwtMC45MzEgLTguMzg1LDAuNTk5IC0xMi40MzYsMi4wNzkgLTMuMTcyLDEuMTU4IC02LjE2MywyLjI1IC04LjU2NywxLjkzNiAtMi40MTMsLTAuMzE4IC01LjAzLC0yLjE1NCAtNy44LC00LjA5OCAtMy41MjUsLTIuNDczIC03LjE2OCwtNS4wMjkgLTExLjQ0OSwtNS4yMTYgLTAuMTY5LC0wLjAwOCAtMC4zMzgsLTAuMDEyIC0wLjUwNSwtMC4wMTIgLTQuMDg0LDAgLTcuNzgzLDIuMTQxIC0xMS4zNjQsNC4yMTMgLTIuOTI3LDEuNjk0IC01LjY5MSwzLjI5NCAtOC4xMTgsMy40IC0yLjQyNiwwLjExNCAtNS4zMTQsLTEuMjQ2IC04LjM3NCwtMi42NzcgLTMuOTA2LC0xLjgyNiAtNy45NDQsLTMuNzE2IC0xMi4yLC0zLjE1MyAtNC4yNDQsMC41NTggLTcuNjQ5LDMuNDIxIC0xMC45NDMsNi4xOSAtMi41OTIsMi4xNzkgLTUuMDQyLDQuMjM4IC03LjQyMSw0Ljc2NiAtMi4zNTksMC41MjEgLTUuNDM1LC0wLjMwNiAtOC42OTIsLTEuMTgyIC00LjE2NywtMS4xMjIgLTguNDc1LC0yLjI4MiAtMTIuNTgzLC0wLjk4NyAtNC4wNzEsMS4yODQgLTYuOTI0LDQuNjkgLTkuNjgyLDcuOTg0IC0yLjE3OSwyLjYwMSAtNC4yMzcsNS4wNTggLTYuNDk5LDUuOTk1IC0xLjUzMSwwLjYzNCAtMi4yNTgsMi4zODkgLTEuNjI0LDMuOTIgMC42MzQsMS41MzEgMi4zOTEsMi4yNTkgMy45MiwxLjYyMyAzLjYyMSwtMS40OTkgNi4yNTUsLTQuNjQ0IDguODAyLC03LjY4NiAyLjMwNywtMi43NTUgNC40ODcsLTUuMzU3IDYuODg4LC02LjExNCAyLjQzMywtMC43NjcgNS43MjksMC4xMiA5LjIxOSwxLjA1OSAzLjgxMiwxLjAyNiA3Ljc1NCwyLjA4NyAxMS41NDksMS4yNDUgMy44MTcsLTAuODQ2IDYuOTUyLC0zLjQ4MiA5Ljk4NSwtNi4wMzEgMi43NTUsLTIuMzE2IDUuMzU3LC00LjUwNCA3Ljg2MywtNC44MzQgMi41MjQsLTAuMzMyIDUuNjA4LDEuMTEyIDguODc2LDIuNjQgMy41ODEsMS42NzQgNy4yNzIsMy40MDcgMTEuMTc4LDMuMjM2IDMuODk2LC0wLjE3IDcuNDM3LC0yLjIxOSAxMC44NjEsLTQuMiAzLjEyLC0xLjgwNiA2LjA2OCwtMy41MSA4LjYwMywtMy40MDEgMi41MywwLjExIDUuMzE1LDIuMDY1IDguMjYzLDQuMTM0IDMuMjQyLDIuMjc0IDYuNTkyLDQuNjI1IDEwLjQ2NCw1LjEzNCAzLjg1OSwwLjUxMyA3LjY5NSwtMC44OTMgMTEuNDA4LC0yLjI0OSAzLjM5MSwtMS4yMzggNi41OTMsLTIuNDA5IDkuMDc5LC0xLjg1NyAyLjQ2NCwwLjU0NiA0Ljg2NCwyLjk1MSA3LjQwNSw1LjQ5NiAyLjgwMSwyLjgwNiA1LjY5Nyw1LjcwNyA5LjQyOSw2Ljg4NCAzLjcwNiwxLjE2NyA3LjcyLDAuNDU0IDExLjYwNSwtMC4yMzUgMy41NiwtMC42MzEgNi45MjUsLTEuMjI5IDkuMjg1LC0wLjI1IDEuNTMsMC42MzYgMy4yODYsLTAuMDkyIDMuOTIsLTEuNjI0IEMgMi4yNTcsMi4zODkgMS41MywwLjYzNCAwLDAgbSAtMzAuMjY1LC01My4zMzQgYyAtMjcuNzc3LC04Ljc0MyAtNTguNjgsLTguNTU5IC01OC44NjksLTguNTU5IC0wLjE4OCwwIC0zMS4wOTIsLTAuMTg1IC01OC44NjksOC41NTkgLTE4LjE1OSw1LjcxNiAtMjguOTE1LDE2LjE1NCAtMjcuNDA1LDI2LjU5MiAwLjY1LDQuNDg3IDIuNjMyLDcuODc3IDUuODkxLDEwLjA3NyA0LjkzNCwzLjMzMiAxMi45NzYsMy45NjggMjIuMDY2LDEuNzQ4IDIzLjMxNCwtNS42OTcgNDEuMywtOC4yMzcgNTguMzE4LC04LjIzNyAxNy4wMTgsMCAzNS4wMDMsMi41NCA1OC4zMTcsOC4yMzcgOS4wOTIsMi4yMiAxNy4xMzIsMS41ODMgMjIuMDY2LC0xLjc0OCAzLjI2LC0yLjIgNS4yNDEsLTUuNTkxIDUuODkxLC0xMC4wNzcgMS41MSwtMTAuNDM4IC05LjI0NiwtMjAuODc1IC0yNy40MDYsLTI2LjU5MiBtIC0xMTMuMTE2LDczLjQyMSBjIDEuOTc3LDAgNC4wNjEsLTAuMjU2IDYuMjE0LC0wLjc4MiAxOS4xOTcsLTQuNjkgMzQuMDExLC02Ljc4MiA0OC4wMzQsLTYuNzgyIDE0LjAyMSwwIDI4LjgzNSwyLjA5MiA0OC4wMzIsNi43ODIgOC4zOTgsMi4wNSAxNS43MDIsLTAuMDE5IDE5LjkwMiwtNS4yOTYgLTQ0LjE2MywtMTUuODE2IC05MS43MTcsLTE1LjgxNSAtMTM1Ljg4MSwwLjAwMyAzLjEyMywzLjkyNiA3Ljk2Nyw2LjA3NSAxMy42OTksNi4wNzUgTSAxOS41MzgsNC42NzQgYyAtNS4wNjUsMTIuMjI5IC0xOS4wODYsMTguMDM3IC0zMS4zMTQsMTIuOTcxIC0xLjIwMywtMC40OTggLTIuNDExLC0wLjk3MyAtMy42MTksLTEuNDQ3IC01LjM5OCw4LjE2OCAtMTUuNjczLDExLjczNSAtMjcuMTI5LDguOTM1IC0xOC43MTIsLTQuNTcxIC0zMy4wODcsLTYuNjEgLTQ2LjYwOSwtNi42MSAtMTMuNTIzLDAgLTI3Ljg5OCwyLjAzOSAtNDYuNjEsNi42MSAtMTEuNDU0LDIuODAxIC0yMS43MzEsLTAuNzY2IC0yNy4xMywtOC45MzYgLTEuMjA4LDAuNDc0IC0yLjQxNiwwLjk1IC0zLjYxOCwxLjQ0OCAtMTIuMjMsNS4wNjYgLTI2LjI1LC0wLjc0MiAtMzEuMzE1LC0xMi45NzEgLTUuMDY1LC0xMi4yMjkgMC43NDIsLTI2LjI0OSAxMi45NzEsLTMxLjMxNCAxLjA5NywtMC40NTUgMi4yMDMsLTAuODc4IDMuMzA1LC0xLjMxNCAtMC41NDUsLTEyLjkxMiAxMS4zNjksLTI0LjY5NSAzMS43MjYsLTMxLjEwMyAyNy45MDYsLTguNzg1IDQ2LjUyLC04LjgyOCA2MC42NTEsLTguODI4IDE0LjEzMiwwIDM2LjcyOSwxLjI4NSA2MC42ODksOC44MjggMjAuMzU4LDYuNDA4IDMyLjI3MiwxOC4xOTIgMzEuNzI3LDMxLjEwMyAxLjEwMSwwLjQzNiAyLjIwOCwwLjg1OSAzLjMwNCwxLjMxNCAxMi4yMjksNS4wNjUgMTguMDM3LDE5LjA4NSAxMi45NzEsMzEuMzE0IgogICAgICAgICAgICAgc3R5bGU9ImZpbGw6IzQ1NDE0MDtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIKICAgICAgICAgICAgIGlkPSJwYXRoOTkiIC8+CiAgICAgICAgPC9nPgogICAgICA8L2c+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K";
  // return "data:image/png;base64,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";
}

function yakisoba() {
  return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmczMDYiCiAgIHdpZHRoPSIyOTMuMzMzMzQiCiAgIGhlaWdodD0iMTkyLjkzMjAxIgogICB2aWV3Qm94PSIwIDAgMjkzLjMzMzM0IDE5Mi45MzIwMSIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzMzEwIj4KICAgIDxjbGlwUGF0aAogICAgICAgY2xpcFBhdGhVbml0cz0idXNlclNwYWNlT25Vc2UiCiAgICAgICBpZD0iY2xpcFBhdGgzMjIiPgogICAgICA8cGF0aAogICAgICAgICBkPSJNIDAsMzAwIEggMzAwIFYgMCBIIDAgWiIKICAgICAgICAgaWQ9InBhdGgzMjAiIC8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KICA8ZwogICAgIGlkPSJnMzE0IgogICAgIHRyYW5zZm9ybT0ibWF0cml4KDEuMzMzMzMzMywwLDAsLTEuMzMzMzMzMywtNTMuMzMzMTk5LDI5Ni40NjYxMykiPgogICAgPGcKICAgICAgIGlkPSJnMzE2Ij4KICAgICAgPGcKICAgICAgICAgaWQ9ImczMTgiCiAgICAgICAgIGNsaXAtcGF0aD0idXJsKCNjbGlwUGF0aDMyMikiPgogICAgICAgIDxnCiAgICAgICAgICAgaWQ9ImczMjQiCiAgICAgICAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjI4LjQxODksODQuMTUwNikiPgogICAgICAgICAgPHBhdGgKICAgICAgICAgICAgIGQ9Im0gMCwwIGggLTE1Ni44MzcgbCAtMTQuOTQ1LDI0LjUwMyBIIDE0Ljk0NSBaIG0gLTEwOC42NzcsNzguMzg4IGMgMjkuMjQ1LDAgNTMuODUxLC0yMC4yMDUgNjAuNjE3LC00Ny4zODUgaCAtNS40MDEgYyAtNi42MzgsMjQuMjY5IC0yOC44NzEsNDIuMTYzIC01NS4yMTYsNDIuMTYzIC0yNi4zNDYsMCAtNDguNTc4LC0xNy44OTQgLTU1LjIxNywtNDIuMTYzIGggLTUuNDAxIGMgNi43NjcsMjcuMTggMzEuMzczLDQ3LjM4NSA2MC42MTgsNDcuMzg1IG0gLTE5Ljc3NSw1LjMxOCBjIDIuMTE3LDIuNTQ1IDQuNzUxLDUuNzEzIDQuNzUxLDExLjY5NiAwLDUuOTg0IC0yLjYzNCw5LjE1MiAtNC43NTEsMTEuNjk3IC0xLjg4NiwyLjI2NyAtMy4yNDksMy45MDUgLTMuMjQ5LDcuNTM5IDAsMS4wNzcgMC4xMzIsMS45NjUgMC4zNDksMi43NTkgaCAxMS4zOTUgYyAtMC4xMzIsLTAuODUgLTAuMjEsLTEuNzYyIC0wLjIxLC0yLjc1OSAwLC01Ljk4NCAyLjYzNCwtOS4xNTEgNC43NTEsLTExLjY5NiAxLjg4NiwtMi4yNjcgMy4yNDksLTMuOTA1IDMuMjQ5LC03LjU0IDAsLTMuNjM0IC0xLjM2MywtNS4yNzIgLTMuMjQ5LC03LjU0IC0wLjg3MywtMS4wNDkgLTEuODI4LC0yLjIxNCAtMi42NTUsLTMuNjMxIC00LjE3NSwtMC41NzEgLTguMjMsLTEuNTE2IC0xMi4xMzQsLTIuODAyIDAuNDk3LDAuNzU3IDEuMDg5LDEuNDc5IDEuNzUzLDIuMjc3IG0gMy44ODQsNDQuNzM5IDEwLjk3MSwwLjI1OCBjIC0wLjUwOSwtMC43OTEgLTEuMTI4LC0xLjUzOSAtMS44MTksLTIuMzcgLTAuNjE2LC0wLjc0IC0xLjI3NCwtMS41MzYgLTEuOSwtMi40MzYgaCAtOS43NTQgYyAwLjk0NywxLjI1NSAxLjg2MywyLjcxMyAyLjUwMiw0LjU0OCBtIDIyLjY0NCwtMTEuMDQ4IGMgLTAuMTMyLC0wLjg1IC0wLjIxMSwtMS43NjIgLTAuMjExLC0yLjc1OSAwLC01Ljk4NCAyLjYzNSwtOS4xNTEgNC43NTIsLTExLjY5NiAxLjg4NiwtMi4yNjcgMy4yNDgsLTMuOTA1IDMuMjQ4LC03LjU0IDAsLTMuNjM0IC0xLjM2MiwtNS4yNzIgLTMuMjQ4LC03LjU0IC0wLjg1NiwtMS4wMjggLTEuNzkyLC0yLjE2NCAtMi42MDcsLTMuNTQxIC0yLjg0OCwwLjM2IC01Ljc0MywwLjU2NyAtOC42ODcsMC41NjcgLTAuMjY2LDAgLTAuNTI4LC0wLjAxNyAtMC43OTMsLTAuMDIgMS44OCwyLjM2OCAzLjgwMyw1LjQyMiAzLjgwMywxMC41MzQgMCw1Ljk4NCAtMi42MzUsOS4xNTIgLTQuNzUyLDExLjY5NyAtMS44ODYsMi4yNjcgLTMuMjQ4LDMuOTA1IC0zLjI0OCw3LjUzOSAwLDEuMDc3IDAuMTMxLDEuOTY1IDAuMzQ5LDIuNzU5IHogbSAtNC40NjksMTEuNDc1IDExLjA4LDAuMjYgYyAtMC41NTEsLTAuOTU0IC0xLjI1NywtMS44MjEgLTIuMDcsLTIuNzk5IC0wLjYxNiwtMC43NCAtMS4yNzUsLTEuNTM2IC0xLjksLTIuNDM2IGggLTkuNzU0IGMgMS4wMTksMS4zNTEgMi4wMDUsMi45MzYgMi42NDQsNC45NzUgbSA2NS4xMjcsLTcwLjQ0IGMgMTkuODU3LDAgMzcuNTAxLC0xMC44NzYgNDYuNzQyLC0yNy40MjkgSCAxLjIwOCBjIC04LjkzMywxNC4zODYgLTI0LjkyOSwyMy43OTggLTQyLjQ3NCwyMy43OTggLTMuMzQsMCAtNi42MTYsLTAuMzY2IC05LjgwNiwtMS4wMiAtMC43MywxLjEwOSAtMS40ODMsMi4yMDEgLTIuMjc1LDMuMjY0IDMuODk1LDAuOTAyIDcuOTM4LDEuMzg3IDEyLjA4MSwxLjM4NyBtIC0yLjEyLC0yMC4zMzggYyAwLjcwMywwLjA0NSAxLjQwOSwwLjA3NSAyLjEyLDAuMDc1IDcuNjI3LDAgMTQuODI0LC0yLjY1MSAyMC41NjQsLTcuMTY2IGggLTIwLjY5NiBjIC0wLjU0MywyLjQxMSAtMS4yMDEsNC43OCAtMS45ODgsNy4wOTEgbSAyLjEyLDYuNTc1IGMgLTEuNTU2LDAgLTMuMDk1LC0wLjEwNCAtNC42MTUsLTAuMjg0IC0wLjUzLDEuMTYzIC0xLjA4OCwyLjMxIC0xLjY3OSwzLjQzOCAyLjA2MywwLjMxMSA0LjE2NSwwLjQ3OCA2LjI5NCwwLjQ3OCAxMy44MzEsMCAyNi41NTksLTYuNzIzIDM0LjYwNywtMTcuMjk4IGggLTQuNjQ1IGMgLTcuNDA5LDguNDUzIC0xOC4yNjQsMTMuNjY2IC0yOS45NjIsMTMuNjY2IG0gLTY3LjQxMSwxNi43NzYgYyAtMTkuODE4LDAgLTM2LjcwOSwtMTIuNzMyIC00Mi45NDgsLTMwLjQ0MiBoIC01LjUxMiBjIDYuNDM5LDIwLjY0IDI1LjcyOCwzNS42NjMgNDguNDYsMzUuNjYzIDIyLjczMiwwIDQyLjAyLC0xNS4wMjMgNDguNDU5LC0zNS42NjMgaCAtNS41MTEgYyAtNi4yMzksMTcuNzEgLTIzLjEzMSwzMC40NDIgLTQyLjk0OCwzMC40NDIgbSAyMi43NDUsLTMwLjQ0MiBoIC00NS40OSBjIDQuODk3LDcuMzU5IDEzLjI2MiwxMi4yMiAyMi43NDUsMTIuMjIgOS40ODMsMCAxNy44NDksLTQuODYxIDIyLjc0NSwtMTIuMjIgbSAtMjIuNzQ1LDE4LjcyIGMgLTEzLjIyMSwwIC0yNC42ODYsLTcuNjMzIC0zMC4yNCwtMTguNzIgaCAtNS43NTIgYyA1LjkxMSwxNC4wNTEgMTkuODE3LDIzLjk0MiAzNS45OTIsMjMuOTQyIDE2LjE3NSwwIDMwLjA4MSwtOS44OTEgMzUuOTkyLC0yMy45NDIgaCAtNS43NTIgYyAtNS41NTQsMTEuMDg3IC0xNy4wMTksMTguNzIgLTMwLjI0LDE4LjcyIE0gMTIuODA4LDMxLjAwMyBjIC05LjgwNSwyMC4zMzUgLTMwLjU2MSwzMy45MjkgLTU0LjA3NCwzMy45MjkgLTUuNzYyLDAgLTExLjM1MSwtMC44MzYgLTE2LjY2MSwtMi4zNyAtOS4yMDUsMTAuMDA4IC0yMS4zMjQsMTcuMjgxIC0zNC45OTcsMjAuNDg5IDAuMTc2LDAuMjE2IDAuMzUxLDAuNDMgMC41MzgsMC42NTUgMi4xMTcsMi41NDUgNC43NTEsNS43MTMgNC43NTEsMTEuNjk2IDAsNS45ODQgLTIuNjM1LDkuMTUyIC00Ljc1MSwxMS42OTcgLTEuODg2LDIuMjY3IC0zLjI0OSwzLjkwNSAtMy4yNDksNy41MzkgMCwxLjA3NyAwLjEzMiwxLjk2NSAwLjM0OSwyLjc1OSBIIDE0LjQ0MiB2IDYuNSBIIC05MS4wMDUgYyAxLjA5LDEuNDQzIDIuMTM5LDMuMTU1IDIuNzY5LDUuNDAxIGwgMTAyLjM3MiwyLjQwMyAtMC4xNTMsNi40OTggLTE1My42NzUsLTMuNjA3IDAuMTUyLC02LjQ5OCA3LjYxMiwwLjE3OCBjIC0wLjQ0OCwtMC42MzYgLTAuOTU3LC0xLjI2IC0xLjUyMSwtMS45MzkgLTAuNjE2LC0wLjc0IC0xLjI3NCwtMS41MzYgLTEuOSwtMi40MzYgaCAtMy44ODQgdiAtNi41IGggMS4yNDMgYyAtMC4xMzIsLTAuODUgLTAuMjExLC0xLjc2MiAtMC4yMTEsLTIuNzU5IDAsLTUuOTg0IDIuNjM1LC05LjE1MSA0Ljc1MiwtMTEuNjk2IDEuODg2LC0yLjI2NyAzLjI0OCwtMy45MDUgMy4yNDgsLTcuNTQgMCwtMy42MzQgLTEuMzYyLC01LjI3MiAtMy4yNDgsLTcuNTQgLTEuODUyLC0yLjIyNSAtNC4wOTksLTQuOTI4IC00LjYzMywtOS41NzMgLTE4Ljk2NCwtOC45NzcgLTMzLjIwOSwtMjYuMzQ3IC0zNy45MDIsLTQ3LjI4NiBoIC0xMi40MzUgdiAtNi41IGggOS4wMjQgbCAxNy45NTksLTI5LjQ0NSBjIDAuNTksLTAuOTY4IDEuNjQxLC0xLjU1OCAyLjc3NCwtMS41NTggSCAxLjgyNCBjIDEuMTMzLDAgMi4xODUsMC41OSAyLjc3NSwxLjU1OCBsIDE3Ljk1OSwyOS40NDUgaCA5LjAyMyB2IDYuNSB6IgogICAgICAgICAgICAgc3R5bGU9ImZpbGw6IzQ1NDE0MDtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIKICAgICAgICAgICAgIGlkPSJwYXRoMzI2IiAvPgogICAgICAgIDwvZz4KICAgICAgPC9nPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==";
  // return "data:image/png;base64,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";
}

function okashi() {
  return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmcyIgogICB3aWR0aD0iMTg0LjE2MzMzIgogICBoZWlnaHQ9IjEyMy4zNzcwNSIKICAgdmlld0JveD0iMCAwIDE4NC4xNjMzMyAxMjMuMzc3MDUiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnMKICAgICBpZD0iZGVmczYiPgogICAgPGNsaXBQYXRoCiAgICAgICBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIKICAgICAgIGlkPSJjbGlwUGF0aDE4Ij4KICAgICAgPHBhdGgKICAgICAgICAgZD0iTSAwLDMwMCBIIDMwMCBWIDAgSCAwIFoiCiAgICAgICAgIGlkPSJwYXRoMTYiIC8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KICA8ZwogICAgIGlkPSJnMTAiCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzMzMzMzLDAsMCwtMS4zMzMzMzMzLC00OC45OTkwMDEsMzE0LjI5ODUyKSI+CiAgICA8ZwogICAgICAgaWQ9ImcxMiI+CiAgICAgIDxnCiAgICAgICAgIGlkPSJnMTQiCiAgICAgICAgIGNsaXAtcGF0aD0idXJsKCNjbGlwUGF0aDE4KSI+CiAgICAgICAgPGcKICAgICAgICAgICBpZD0iZzIwIgogICAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEyMy4wMTU1LDE2Ni4yNzgxKSI+CiAgICAgICAgICA8cGF0aAogICAgICAgICAgICAgZD0iTSAwLDAgNi4yNSw0Ni4wNDQgQyAxMS4zMzMsNDIuNTYgMTQuODYyLDM3Ljc3IDE2LjM2MSwzMi4xNzQgMTguMjc5LDI1LjAxNiAxNi42NzksMTcuMzM1IDExLjg1NCwxMC41NDYgOC44MjgsNi4yODggNC43NjYsMi43MDQgMCwwIG0gLTI4LjAzOCwtNC44MjUgNy42MTMsNTYuMDkyIGMgMi4yOSwwLjM4MyA0LjU3NywwLjU5NyA2LjgzNSwwLjU5NyAyLjUyMiwwIDUuMDA0LC0wLjI0OCA3LjQxMywtMC43MjEgbCAtNy42MDYsLTU2LjAzMiBjIC00Ljg0OCwtMC44MzQgLTkuNjg1LC0wLjgwOCAtMTQuMjU1LDAuMDY0IG0gLTMwLjI5NiwtMTAuMDkgYyAtMS41MjEsLTEuMzI5IC0zLjU0MiwtMS45MDUgLTUuNTQxLC0xLjU4NCAtMS44NywwLjMwMiAtMy40MTMsMS4zMzggLTQuMzQ0LDIuOTE3IC0wLjA5NCwwLjE1OCAtMC4xNjgsMC4zNDMgLTAuMjI4LDAuNTY1IC0wLjI1OSwwLjk3IDAuMDQyLDEuNTUyIDEuMzc5LDMuMzQ2IDEuNDE1LDEuOSAzLjU1NCw0Ljc3MSAyLjQ0NCw4LjkxMSAtMS4xMDksNC4xNDEgLTQuMzk3LDUuNTU4IC02LjU3Miw2LjQ5NiAtMi4wNTUsMC44ODYgLTIuNjA3LDEuMjM4IC0yLjg2NywyLjIwOCAtMC4yNiwwLjk3MSAwLjA0MiwxLjU1MiAxLjM3OSwzLjM0NyAxLjQxNCwxLjg5OSAzLjU1Myw0Ljc3IDIuNDQzLDguOTExIC0xLjEwOSw0LjE0MSAtNC4zOTcsNS41NTggLTYuNTcyLDYuNDk2IC0yLjA1NSwwLjg4NSAtMi42MDcsMS4yMzggLTIuODY3LDIuMjA3IC0wLjA1OSwwLjIyMiAtMC4wODcsMC40MjEgLTAuMDg2LDAuNjA1IDAuMDE3LDEuODMyIDAuODM1LDMuNSAyLjMwNSw0LjY5NyAxLjU3LDEuMjc5IDMuNjA3LDEuNzg5IDUuNTksMS4zOTggbCAxNi4zNDYsLTMuMjIyIGMgLTIuNjMzLC02LjMyIC0zLjMxOCwtMTMuMTg3IC0xLjUyNSwtMTkuODggMS43NTksLTYuNTY0IDUuNjYxLC0xMi4yMjQgMTEuMjMyLC0xNi40NzkgeiBNIC0zNC4xOTUsNDYuNDc2IC00MC40NzcsMC4xOSBjIC01LjE4MiwzLjQ5MyAtOC43NzcsOC4zMzMgLTEwLjI5NCwxMy45OTYgLTMuMjY0LDEyLjE3OSAzLjg4LDI1LjE3MiAxNi41NzYsMzIuMjkgbSA1OC4xMiwxNC43OTggYyAxLjUyMSwxLjMyOSAzLjU0NCwxLjkwNyA1LjU0LDEuNTg0IDEuODcxLC0wLjMwMiAzLjQxMywtMS4zMzcgNC4zNDMsLTIuOTE0IDAuMDk0LC0wLjE2MSAwLjE3LC0wLjM0NyAwLjIyOCwtMC41NjggMC4yNjEsLTAuOTcgLTAuMDQxLC0xLjU1MiAtMS4zNzgsLTMuMzQ2IC0xLjQxNSwtMS45IC0zLjU1MywtNC43NzEgLTIuNDQ0LC04LjkxMiAxLjExLC00LjE0IDQuMzk3LC01LjU1NyA2LjU3MiwtNi40OTUgMi4wNTYsLTAuODg1IDIuNjA4LC0xLjIzOCAyLjg2NywtMi4yMDggMC4yNiwtMC45NzEgLTAuMDQyLC0xLjU1MiAtMS4zNzksLTMuMzQ3IC0xLjQxMywtMS44OTkgLTMuNTUyLC00Ljc3IC0yLjQ0NCwtOC45MTEgMS4xMSwtNC4xNCA0LjM5OCwtNS41NTggNi41NzMsLTYuNDk1IDIuMDU1LC0wLjg4NiAyLjYwNywtMS4yMzggMi44NjgsLTIuMjEgMC4wNTgsLTAuMjIgMC4wODYsLTAuNDE4IDAuMDg1LC0wLjYwNCAtMC4wMTcsLTEuODMxIC0wLjgzNCwtMy40OTkgLTIuMzAzLC00LjY5NSAtMS41NzIsLTEuMjggLTMuNjEsLTEuNzg4IC01LjU5MSwtMS4zOTkgbCAtMTYuMzEsMy4yMTUgQyAyMy44NSwyMC40NCAyNC4zOTksMjcuMjkyIDIyLjY0LDMzLjg1NiAyMC44ODEsNDAuNDIgMTYuOTc5LDQ2LjA3OSAxMS40MDgsNTAuMzM1IFogTSAxNy4xNTIsNi43ODEgYyAwLjI4LDAuMzk0IDAuNTQzLDAuNzk0IDAuODA1LDEuMTkzIEwgMzYuMjA1LDQuMzc3IGMgMC44NTgsLTAuMTcgMS43MiwtMC4yNTMgMi41NzYsLTAuMjUzIDMuMDI3LDAuMDAxIDUuOTgxLDEuMDM3IDguMzc2LDIuOTg5IDIuOTUyLDIuNDA1IDQuNjY0LDUuOTMyIDQuNjk5LDkuNjc5IDAuMDA2LDAuNzcyIC0wLjA5NywxLjU2MSAtMC4zMDcsMi4zNDMgLTEuMTEsNC4xNDEgLTQuMzk3LDUuNTU4IC02LjU3Myw2LjQ5NiAtMi4wNTUsMC44ODYgLTIuNjA3LDEuMjM4IC0yLjg2NywyLjIwOCAtMC4yNTksMC45NyAwLjA0MywxLjU1MiAxLjM3OSwzLjM0NyAxLjQxNCwxLjg5OSAzLjU1Myw0Ljc3IDIuNDQ1LDguOTExIC0xLjExMSw0LjE0MSAtNC4zOTgsNS41NTggLTYuNTc0LDYuNDk2IC0yLjA1NCwwLjg4NSAtMi42MDYsMS4yMzggLTIuODY2LDIuMjA4IC0wLjI2MSwwLjk3MSAwLjA0MSwxLjU1MiAxLjM3OCwzLjM0NiAxLjQxNSwxLjkgMy41NTQsNC43NzEgMi40NDQsOC45MTMgLTAuMjExLDAuNzg1IC0wLjUxNiwxLjUyIC0wLjkwNywyLjE4MyAtMS45MDIsMy4yMjcgLTUuMTQ5LDUuNDI1IC04LjkwOCw2LjAzMiAtMy45MDksMC42MyAtNy44NywtMC41IC0xMC44NTIsLTMuMTA3IEwgNS42NDMsNTMuOTI5IGMgLTAuNDI3LDAuMjE1IC0wLjg1NCwwLjQzIC0xLjI5MywwLjYzMSAtOS4xNTcsNC4xOTEgLTE5Ljk5OSw0Ljk0NSAtMzAuNTMyLDIuMTIzIC0yLjM5NywtMC42NDMgLTQuNjkxLC0xLjQ2IC02Ljg4MSwtMi40MTQgbCAtMC4wNzMsMC4wMSAtMC4wMDYsLTAuMDQ0IGMgLTguMTk1LC0zLjU4OSAtMTQuODMzLC05LjIxOSAtMTkuMTksLTE1Ljg1NyBsIC0xOC4yODIsMy42MDQgYyAtMy44ODIsMC43NjYgLTcuODc3LC0wLjIzMSAtMTAuOTUyLC0yLjczNiAtMi45NTIsLTIuNDA0IC00LjY2NSwtNS45MzEgLTQuNywtOS42NzkgLTAuMDA2LC0wLjc2OSAwLjA5NywtMS41NTcgMC4zMDgsLTIuMzQ0IDEuMTA5LC00LjE0IDQuMzk3LC01LjU1NyA2LjU3MiwtNi40OTUgMi4wNTUsLTAuODg1IDIuNjA3LC0xLjIzOCAyLjg2NywtMi4yMDggMC4yNiwtMC45NzEgLTAuMDQyLC0xLjU1MiAtMS4zNzksLTMuMzQ3IC0xLjQxNCwtMS44OTkgLTMuNTUzLC00Ljc3IC0yLjQ0NCwtOC45MTEgMS4xMSwtNC4xNCA0LjM5NywtNS41NTggNi41NzMsLTYuNDk1IDIuMDU0LC0wLjg4NiAyLjYwNiwtMS4yMzggMi44NjYsLTIuMjA5IDAuMjYsLTAuOTcgLTAuMDQxLC0xLjU1MSAtMS4zNzgsLTMuMzQ2IC0xLjQxNSwtMS45IC0zLjU1NCwtNC43NzEgLTIuNDQ0LC04LjkxMiAwLjIxMSwtMC43ODcgMC41MTcsLTEuNTIzIDAuOTA3LC0yLjE4NSAxLjkwMywtMy4yMjYgNS4xNDksLTUuNDI0IDguOTA3LC02LjAzMSAwLjcxMiwtMC4xMTUgMS40MjUsLTAuMTcxIDIuMTM0LC0wLjE3MSAzLjE4OCwwIDYuMjgsMS4xNDYgOC43MiwzLjI3OCBsIDE0LjAwNCwxMi4yMzkgYyAwLjQyNywtMC4yMTUgMC44NTQsLTAuNDMgMS4yOTMsLTAuNjMxIDUuNTE2LC0yLjUyNCAxMS42NDIsLTMuODAyIDE3Ljk0NSwtMy44MDIgNC4xNjEsMCA4LjM5OSwwLjU1NyAxMi41ODgsMS42OCAxMC41MzMsMi44MjIgMTkuNTQ2LDguODk2IDI1LjM3OSwxNy4xMDQiCiAgICAgICAgICAgICBzdHlsZT0iZmlsbDojNDU0MTQwO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIgogICAgICAgICAgICAgaWQ9InBhdGgyMiIgLz4KICAgICAgICA8L2c+CiAgICAgIDwvZz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=";
  // return "data:image/png;base64,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";
}

function onigiri() {
  return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmcyIgogICB3aWR0aD0iMzAyLjcyNjg0IgogICBoZWlnaHQ9IjI3My4zNDUzNCIKICAgdmlld0JveD0iMCAwIDMwMi43MjY4NCAyNzMuMzQ1MzQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnMKICAgICBpZD0iZGVmczYiPgogICAgPGNsaXBQYXRoCiAgICAgICBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIKICAgICAgIGlkPSJjbGlwUGF0aDE4Ij4KICAgICAgPHBhdGgKICAgICAgICAgZD0iTSAwLDMwMCBIIDMwMCBWIDAgSCAwIFoiCiAgICAgICAgIGlkPSJwYXRoMTYiIC8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KICA8ZwogICAgIGlkPSJnMTAiCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzMzMzMzLDAsMCwtMS4zMzMzMzMzLC00OC42MzYzNjQsMzM2LjY3Mjc5KSI+CiAgICA8ZwogICAgICAgaWQ9ImcxMiI+CiAgICAgIDxnCiAgICAgICAgIGlkPSJnMTQiCiAgICAgICAgIGNsaXAtcGF0aD0idXJsKCNjbGlwUGF0aDE4KSI+CiAgICAgICAgPGcKICAgICAgICAgICBpZD0iZzIwIgogICAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI1MC41NDU5LDc3LjkzMjYpIj4KICAgICAgICAgIDxwYXRoCiAgICAgICAgICAgICBkPSJtIDAsMCBjIC04LjIzNywtMTQuNjc2IC0yMy4yMDMsLTIzLjQzNyAtNDAuMDMzLC0yMy40MzcgaCAtMTEuOTIgdiA5My42ODUgaCAtOTcuMTg2IHYgLTkzLjY4NSBoIC0xMS45MTkgYyAtMTYuODMsMCAtMzEuNzk2LDguNzYxIC00MC4wMzUsMjMuNDM4IC04LjIzOCwxNC42NzYgLTcuOTIzLDMyLjAxNSAwLjg0Miw0Ni4zODEgbCA2MC41MTMsOTkuMTkgYyA4LjQwNCwxMy43NzYgMjMuMDU1LDIyIDM5LjE5MiwyMiAxNi4xMzcsMCAzMC43ODgsLTguMjI0IDM5LjE5MiwtMjIgTCAtMC44NDIsNDYuMzgyIEMgNy45MjQsMzIuMDE2IDguMjM4LDE0LjY3NiAwLDAgbSA1LjEzNSw1MC4wMjggLTYwLjUxMiw5OS4xOSBjIC05LjY4NiwxNS44NzYgLTI2LjU3MSwyNS4zNTQgLTQ1LjE2OSwyNS4zNTQgLTE4LjU5OCwwIC0zNS40ODMsLTkuNDc4IC00NS4xNjgsLTI1LjM1NCBsIC02MC41MTMsLTk5LjE5IGMgLTEwLjEwMSwtMTYuNTU3IC0xMC40NjQsLTM2LjU0MSAtMC45NywtNTMuNDU0IDkuNDk0LC0xNi45MTQgMjYuNzQyLC0yNy4wMTEgNDYuMTM5LC0yNy4wMTEgaCAxMjEuMDI1IGMgMTkuMzk1LDAgMzYuNjQzLDEwLjA5NyA0Ni4xMzcsMjcuMDExIDkuNDk1LDE2LjkxMyA5LjEzMiwzNi44OTcgLTAuOTY5LDUzLjQ1NCIKICAgICAgICAgICAgIHN0eWxlPSJmaWxsOiM0NTQxNDA7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOm5vbmUiCiAgICAgICAgICAgICBpZD0icGF0aDIyIiAvPgogICAgICAgIDwvZz4KICAgICAgPC9nPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==";
  // return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAA6CAYAAAAA0F95AAAACXBIWXMAAAMfAAADHwHmEQywAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAB/RJREFUaIHdm2lsVNcVx3/njleW2CwG2lRUVI1KSD4EYoViKJ43q3GbfKGZpJtEN0VNDCVNSBWKghwlStNARR1TqiZNpEhpiyWqBsrg8XjmjSlL2iBKFxLStEqFlNbFrsE4kcGeeacfxq5YYjz2vPFAf5+e595z7v/8fef5vXuvRVWZCiKRSNm53t4AqmsQXSbIJxSqAQTOKfxdkOOIc6BqzrxEW1vb0FTokkIbYFlWdanIBtANwJwcw3pBW4ZVnrdt+1wh9RXUgJDfey8qzwPzAVDeAPaIMUc9w8NvzViwoA/g/e7u2emSkiUqukKUtUAtgEC3gzTFk8k9hdJYEAMikYinv6dnmwobRz5KqLIlbtuv5xIfCHhXGIenQHxZlWxfuTr12Nat6rit1XUDRESCPu8rKF8GLojS1JFKvaQTHEhEJOj1fh3heaBC0Fc67K51E80z7jhuGxDyeZ8FeQw45xht7OxMHc0nX9jvr1N19gPVIM90JJOb3VGaxVUDwgFvUB2JAReN0VB7Z+q3ruT1+1erOjGgXJVQ3LY73cgLYNxKFA6Hp6vDi4Co8LhbxQPEEomDgm4GRER/Fg6Hp7uV2zUDdPjiEyALgcOrVqda3Mo7Sl1914+AwyALs2O5gytfgUAgsMQ4mROAGKS2PZn8Y/7SriZsWbercBwQx3ju7Ozs/FO+OV2ZAZLJtAKloC2FKh4gZtt/UaQVKJFMplVEJN+ceRsQ8nu/IoIl0K2e0ifzzTce04aGtgLvifCZoNf7pXzz5WVAY2PjTag8C4CyMR6P9+craDxeO3RoQJRHARC2WZZVnU++vAxIDw4+DXxEoDNm27vzyTURYrb9S5QDwPwykbxm3aQNaPD7lyF8C3QIZX0+IiaF43wbuKg4DzX4/XdNNs2kDGhuFuOosxPwqMoPYrZ9arICJktHV9c7ImyDrJbmZplULZMKOpzyfhP4NOhpU1b2/cnkcIOBwYtPA+8CtUe6rG9MJseEnwMCgcAc42ROAXNF9J5YIrVvMgO7RdjvXaMqUdC+krSzOHrwYM9E4ic8A4zjPAfMFXit2MUDxBKpA6B7QWYPl5gJz8YJGRDy+VaCrgMGyTgPT3SwQqGe0vXAB4J8NeTz1U8kNmcDIpGIB7QVEJCnYl1d705UaKGIx+OnVXkGENDW2tra0lxjczagv/fMBuAOhHdKKiq2T0ZoIZlVU/McwlvA7bOqZj6Ua1xON0HLshaUCqeAKpBARzKZyENrwchOf7UV3nfE3JpIJN4bLyanGVAi7CBb/C+u1+IBOpLJLoTdAjM9ONtyiRnXgKBlBQTuUxjIiGzKX2ZhGXZ4GOhHuT9gWQ3j9b+mAZFIpEyyi5IgPJHLlCo2tm13C9oMYAwtjY2N5dfqf00Dzvb0bAIWI/z5bP/AThd1FpSqufNagBMot6QvXHjkWn3HvAkGg8GFkkm/CUwTMd5YInGwAFoLxshq8iHggmSc28b6sz3mDJB0uhWYDrx0oxUPEEskjij6MlCpHtkxVr8PnQFhv/duVdkL2jes8inbtnvHGzDo860V1U/mJzs3VORvuWyXWZY1t1T0bZDZY723XGVAXV1d5YyK8pPAIkEeiCWTP81FVMiy9iLcnWsReaHs67Dte3LpGrKsBxB+AnpaSsuXxGKxDy5tv+orMKOibAuwCOWNunr7RZckF42V3tQLohwFWUh66PEr2y8zIFRffwvII6COMaapEJuRU83WreqIMU1ARlU3hS1r8aXtlxkgHtMClAtmZ3si8fupFFpI2hOJ4yi7QMoYfa4Z4X8GhC3rfoUG4N9Dqq7tvFwvlFRWfg/0nwqBsGXdN/q5geyNT4Xss7PyaKFPZRSDaDR6HpXvAqiwva6urhJGDJhZUdYE3Ax6JJ5KvVpEnQUlW5seAW6eUV7+IICJRCIeZfQkh9ns9gGE6wlVVWPYAoCwsblZjOnvO+MD+ShwsiOZ7CquxMLT3pmyRxZOPna4y7KMqoSzTTplOzvFRh12AyiEDcpyAFVx7UDD9Y6IHAIQnOUGWARgysreLKqqKWRY9WT2ShYZYC6oU1VV9Z+iqppaegEFakz2Iv+DBjcSAwMDAgiQMUA/IH19fXnts99IVFdXz85eab9R5a8AHtXbiilqKhmtVVXeNiL6h+wPuqq4sqYOx3FWACBywiCe/QCKs7aoqqYQMawFENhv+vr7bdAzgizLbn7+fxO0rFUoSwW6h1W7zLFjx4YFRhYNnSfdOHp2vSIiIpLdM1Blh23baQPgqZi2U6AbxBfw1a8rqsoCkq1NfMC/Siord8HI63A0Gj3vIE0AorIzn0NH1ysNfv8yyf7zBoo0RaPR83DJilA8mdwjyC6g0lFnb7C+fmmRtLpOg9+/zNHMAWA6Sms8mfzVaNtla4JDqhuyx02YLx5JhfzeL0y1WLcJ+nxfzKiTApmnwq+ra2o2Xtp+mQG2baeHVdaCvAxyEyo/D/qtfSHLumNKVbtAsL5+achn/UbQVwVmCvJC2uHetra2zKX9Sq4MtG07DXwt5PfaqLSI8jmEz4Z81u9U2IPD62k4VVNTc/bKZMUiEol4enp6ZpV79NaMynJRPi8ecxfZ5/2zoqyP2ckPXeq75gmR7NaSfAf0QaCqMPILxjnQHzum5IednZ1jvunmdESmsbGxPDM4uEaFAHAn8HFgFlDhmtz8uED2N/0PFY4rEi+tqGiPRqMXxwv8L6AqMBRqWz4lAAAAAElFTkSuQmCC";
}

function volunteer() {
  return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmcyIgogICB3aWR0aD0iMjI4Ljc3NDEyIgogICBoZWlnaHQ9IjMwMS4zMzM0NCIKICAgdmlld0JveD0iMCAwIDIyOC43NzQxMiAzMDEuMzMzNDQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnMKICAgICBpZD0iZGVmczYiPgogICAgPGNsaXBQYXRoCiAgICAgICBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIKICAgICAgIGlkPSJjbGlwUGF0aDE4Ij4KICAgICAgPHBhdGgKICAgICAgICAgZD0iTSAwLDMwMCBIIDMwMCBWIDAgSCAwIFoiCiAgICAgICAgIGlkPSJwYXRoMTYiIC8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KICA8ZwogICAgIGlkPSJnMTAiCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzMzMzMzLDAsMCwtMS4zMzMzMzMzLC04NS42MTI3MTcsMzUwLjY2Njc5KSI+CiAgICA8ZwogICAgICAgaWQ9ImcxMiI+CiAgICAgIDxnCiAgICAgICAgIGlkPSJnMTQiCiAgICAgICAgIGNsaXAtcGF0aD0idXJsKCNjbGlwUGF0aDE4KSI+CiAgICAgICAgPGcKICAgICAgICAgICBpZD0iZzIwIgogICAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIzNS40MDMzLDI2MS40NzQxKSI+CiAgICAgICAgICA8cGF0aAogICAgICAgICAgICAgZD0ibSAwLDAgYyAtMC41MzIsMC45NDMgLTEuNTMxLDEuNTI2IC0yLjYxMywxLjUyNiBoIC00OS40OTkgYyAtMS4wNTEsMCAtMi4wMjUsLTAuNTQ5IC0yLjU2OCwtMS40NDkgbCAtMjYuNTc3LC00My45OSAzLjUxMiwtNS43OSAyNy4zMjUsNDUuMjI5IGggNDIuNDg5IGwgLTQ4LjUyNywtODAuMzIzIDMuMTk5LC01LjI3NSBjIDAuMTEsLTAuMTggMC4xOTIsLTAuMzcgMC4yODgsLTAuNTU1IEwgLTAuMDQ2LC0zLjAyNSBDIDAuNTE1LC0yLjA5OSAwLjUzMSwtMC45NDMgMCwwIgogICAgICAgICAgICAgc3R5bGU9ImZpbGw6IzQ1NDE0MDtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIKICAgICAgICAgICAgIGlkPSJwYXRoMjIiIC8+CiAgICAgICAgPC9nPgogICAgICAgIDxnCiAgICAgICAgICAgaWQ9ImcyNCIKICAgICAgICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNTEuNTMwMyw0MykiPgogICAgICAgICAgPHBhdGgKICAgICAgICAgICAgIGQ9Im0gMCwwIGMgLTMwLjY5MywwIC01NS42NjQsMjQuOTcxIC01NS42NjQsNTUuNjY0IDAsMzAuNjkzIDI0Ljk3MSw1NS42NjUgNTUuNjY0LDU1LjY2NSAzMC42OTMsMCA1NS42NjQsLTI0Ljk3MiA1NS42NjQsLTU1LjY2NSBDIDU1LjY2NCwyNC45NzEgMzAuNjkzLDAgMCwwIG0gLTMuNjQsMTIwLjIxNiBoIDcuMjggdiAtMy4wMDQgYyAtMS4yMDUsMC4wNzEgLTIuNDE3LDAuMTE3IC0zLjY0LDAuMTE3IC0xLjIyMywwIC0yLjQzNCwtMC4wNDYgLTMuNjQsLTAuMTE3IHogTSAtNzguOTkyLDIxNCBIIC0zNi41MSBMIDE2LjczNiwxMjYuMjE2IEggLTI1Ljc0NSBaIE0gOS42NCwxMTYuNTcgdiAzLjY0NiBoIDEyLjQyNCBjIDEuMDgzLDAgMi4wODMsMC41ODQgMi42MTUsMS41MjkgMC41MzEsMC45NDMgMC41MTIsMi4xMDEgLTAuMDQ5LDMuMDI3IGwgLTU2Ljg4Niw5My43ODQgQyAtMzIuOCwyMTkuNDUzIC0zMy43NzIsMjIwIC0zNC44MjEsMjIwIGggLTQ5LjUgYyAtMS4wODMsMCAtMi4wODIsLTAuNTg0IC0yLjYxNCwtMS41MjggLTAuNTMxLC0wLjk0NCAtMC41MTMsLTIuMTAxIDAuMDQ5LC0zLjAyOCBsIDU2Ljg4NywtOTMuNzgzIGMgMC41NDQsLTAuODk3IDEuNTE2LC0xLjQ0NSAyLjU2NSwtMS40NDUgSCAtOS42NCBWIDExNi41NyBDIC0zOS4wNzgsMTExLjkyOCAtNjEuNjY0LDg2LjM4NyAtNjEuNjY0LDU1LjY2NCAtNjEuNjY0LDIxLjY2MiAtMzQuMDAxLC02IDAsLTYgYyAzNC4wMDIsMCA2MS42NjQsMjcuNjYyIDYxLjY2NCw2MS42NjQgMCwzMC43MjMgLTIyLjU4Niw1Ni4yNjQgLTUyLjAyNCw2MC45MDYiCiAgICAgICAgICAgICBzdHlsZT0iZmlsbDojNDU0MTQwO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIgogICAgICAgICAgICAgaWQ9InBhdGgyNiIgLz4KICAgICAgICA8L2c+CiAgICAgICAgPGcKICAgICAgICAgICBpZD0iZzI4IgogICAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE2NS42NDA2LDkyLjI1NTkpIj4KICAgICAgICAgIDxwYXRoCiAgICAgICAgICAgICBkPSJtIDAsMCBjIC0wLjc1MywtMC43MDQgLTEuMDkxLC0xLjc0NSAtMC44OTYsLTIuNzU4IGwgMy4yNDEsLTE2LjgzIC0xNS4wMDUsOC4yODIgYyAtMC40NTEsMC4yNSAtMC45NSwwLjM3NCAtMS40NSwwLjM3NCAtMC40OTksMCAtMC45OTksLTAuMTI0IC0xLjQ1LC0wLjM3NCBsIC0xNS4wMDUsLTguMjgyIDMuMjQxLDE2LjgzIGMgMC4xOTUsMS4wMTMgLTAuMTQ0LDIuMDU0IC0wLjg5NiwyLjc1OCBsIC0xMi41MTQsMTEuNzEgMTcuMDA3LDIuMTIgYyAxLjAyMywwLjEyNyAxLjkwOSwwLjc3MSAyLjM0NiwxLjcwNCBsIDcuMjcxLDE1LjUyIDcuMjcsLTE1LjUyIGMgMC40MzgsLTAuOTMzIDEuMzIzLC0xLjU3NyAyLjM0NiwtMS43MDQgbCAxNy4wMDgsLTIuMTIgeiBtIDE5LjYxLDE2Ljg3MiAtMjEuNzE4LDIuNzA3IC05LjI4NiwxOS44MTkgYyAtMC40OTQsMS4wNTUgLTEuNTUyLDEuNzI4IC0yLjcxNiwxLjcyOCAtMS4xNjQsMCAtMi4yMjMsLTAuNjczIC0yLjcxNywtMS43MjggbCAtOS4yODUsLTE5LjgxOSAtMjEuNzE5LC0yLjcwNyBjIC0xLjE1NSwtMC4xNDMgLTIuMTIzLC0wLjk0MiAtMi40ODIsLTIuMDUgLTAuMzYsLTEuMTA2IC0wLjA0NywtMi4zMjIgMC44MDMsLTMuMTE3IGwgMTUuOTgxLC0xNC45NTQgLTQuMTM4LC0yMS40OTIgYyAtMC4yMjEsLTEuMTQ0IDAuMjQsLTIuMzExIDEuMTgyLC0yLjk5NCAwLjk0MiwtMC42ODQgMi4xOTMsLTAuNzYzIDMuMjEzLC0wLjIgbCAxOS4xNjIsMTAuNTc3IDE5LjE2MSwtMTAuNTc3IGMgMC40NTMsLTAuMjUxIDAuOTUyLC0wLjM3NCAxLjQ1LC0wLjM3NCAwLjYyMSwwIDEuMjQsMC4xOTQgMS43NjQsMC41NzQgMC45NDEsMC42ODMgMS40MDIsMS44NSAxLjE4MiwyLjk5NCBsIC00LjEzOCwyMS40OTIgMTUuOTgsMTQuOTU0IGMgMC44NSwwLjc5NSAxLjE2MywyLjAxMSAwLjgwNCwzLjExNyAtMC4zNjEsMS4xMDggLTEuMzI3LDEuOTA3IC0yLjQ4MywyLjA1IgogICAgICAgICAgICAgc3R5bGU9ImZpbGw6IzQ1NDE0MDtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIKICAgICAgICAgICAgIGlkPSJwYXRoMzAiIC8+CiAgICAgICAgPC9nPgogICAgICA8L2c+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K";
}