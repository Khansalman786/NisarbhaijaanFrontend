const payoutIds = [
  "TJ2018163006784_0",
  "TJ2021163034079_0",
  "TJ2094163044436_0",
  "TJ2025163056404_0",
  "TJ2090163057982_0",
  "TJ2082163059988_0",
  "TJ2013163068702_0",
  "TJ2085163069517_0",
  "TJ2056163075253_0",
  "TJ2003163077293_0",
  "TJ2060163081630_0",
  "TJ2091163095040_0",
  "TJ2035163096631_0",
  "TJ2038163114014_0",
  "TJ2083163114259_0",
  "TJ2023163144136_0",
  "TJ2034163144718_0",
  "TJ2000163146463_0",
  "TJ2050163156068_0",
  "TJ2018163158625_0",
  "TJ2091163159577_0",
  "TJ2024163181624_0",
  "TJ2044163200370_0",
  "TJ2084163205797_0",
  "TJ2054163206625_0",
  "TJ2016163207862_0",
  "TJ2061163217498_0",
  "TJ2060163240820_0",
  "TJ2031163258129_0",
  "TJ2079163282183_0",
  "TJ2070163292687_0",
  "TJ2010163308034_0",
  "TJ2072163318701_0",
  "TJ2092163319083_0",
  "TJ2043163326982_0",
  "TJ2031163348938_0",
  "TJ2062163355779_0",
  "TJ2080163374608_0",
  "TJ2058163385096_0",
  "TJ2004163410109_0",
  "TJ2064163425642_0",
  "TJ2015163460730_0",
  "TJ2097163463357_0",
  "TJ2046163474974_0",
  "TJ2056163477860_0",
  "TJ2078163485011_0",
  "TJ2081163495802_0",
  "TJ2084163501550_0",
  "TJ2043163514955_0",
  "TJ2077163533226_0",
  "TJ2058163533452_0",
  "TJ2003163545282_0",
  "TJ2075163589195_0",
  "TJ2092163127496_1",
  "TJ2078163128926_1",
  "TJ2053163610945_0",
  "TJ2020163616225_0",
  "TJ2088163628200_0",
];

const apiUrl = "https://nisarbhaijaan.onrender.com/payout-status";

function flattenObject(obj, prefix = "") {
  let result = {};

  for (let key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(obj[key])) {
      obj[key].forEach((item, index) => {
        Object.assign(result, flattenObject(item, `${newKey}[${index}]`));
      });
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      Object.assign(result, flattenObject(obj[key], newKey));
    } else {
      result[newKey] = obj[key];
    }
  }

  return result;
}

function formatHeader(text) {
  return text
    .replace("response.", "")
    .replace("authList[0].", "")
    .replace("fundingAccount.", "")
    .replace("amountBreakup[0].", "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

async function loadData() {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");

  tableBody.innerHTML = "<tr><td>Loading...</td></tr>";

  const requests = payoutIds.map((id) =>
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: id }),
    })
      .then((res) => res.json())
      .then((data) => flattenObject(data))
      .catch(() => ({ error: "API Error" })),
  );

  const results = await Promise.all(requests);

  tableBody.innerHTML = "";

  const columns = Object.keys(results[0] || {});

  tableHead.innerHTML =
    "<tr>" +
    columns
      .map((col) => `<th>${formatHeader(col)}</th>`)

      .join("") +
    "</tr>";

  results.forEach((row) => {
    const tr =
      "<tr>" +
      columns
        .map((col) => `<td>${row[col] ?? "-"}</td>`)

        .join("") +
      "</tr>";

    tableBody.insertAdjacentHTML("beforeend", tr);
  });
}

loadData();

// SEARCH

document.getElementById("search").addEventListener("keyup", function () {
  const value = this.value.toLowerCase();

  document.querySelectorAll("#payoutTable tbody tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
});

// EXPORT EXCEL

function exportExcel() {
  let table = document.getElementById("payoutTable");

  let html = table.outerHTML;

  let url = "data:application/vnd.ms-excel," + encodeURIComponent(html);

  let a = document.createElement("a");

  a.href = url;

  a.download = "payout-report.xls";

  a.click();
}
