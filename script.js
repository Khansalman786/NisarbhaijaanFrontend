let uploadedFile = null;

// use localhost during development; switch to deployed host otherwise
const apiUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/upload"
    : "https://nisarbhaijaan.onrender.com/upload";
console.log("using apiUrl", apiUrl);

document.getElementById("excelFile").addEventListener("change", function (e) {
  uploadedFile = e.target.files[0];

  console.log("File Selected:", uploadedFile);
});

async function processFile() {
  if (!uploadedFile) {
    alert("Please upload file first");
    return;
  }

  const form = new FormData();
  form.append("excel", uploadedFile);

  const tableBody = document.getElementById("tableBody");
  const tableHead = document.getElementById("tableHead");

  tableBody.innerHTML = "<tr><td>Loading data...</td></tr>";

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      body: form,
    });

    /* FIX FOR "Unexpected token <" */
    const text = await res.text();

    console.log("Raw Server Response:", text);

    let response;

    try {
      response = JSON.parse(text);
    } catch (e) {
      throw new Error("Server returned HTML instead of JSON");
    }

    if (!res.ok || !Array.isArray(response.results)) {
      tableBody.innerHTML = `<tr><td>${response.error || "Server error"}</td></tr>`;

      return;
    }

    const raw = response.results;

    // flatten nested objects so table shows each field
    // arrays of objects are expanded by index (e.g. authList[0].errorMessage)
    function flatten(obj, prefix = "") {
      return Object.entries(obj).reduce((acc, [k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        if (Array.isArray(v)) {
          if (v.length > 0 && typeof v[0] === "object" && v[0] !== null) {
            // expand each item in the array
            v.forEach((item, i) => {
              Object.assign(acc, flatten(item, `${key}[${i}]`));
            });
          } else {
            // primitive array, leave as-is
            acc[key] = v;
          }
        } else if (v && typeof v === "object") {
          Object.assign(acc, flatten(v, key));
        } else {
          acc[key] = v;
        }
        return acc;
      }, {});
    }

    const data = raw.map((r) => flatten(r));

    // reset search filter
    const searchInput = document.getElementById("search");
    if (searchInput) searchInput.value = "";

    console.log("rendering", data.length, "rows");
    tableBody.innerHTML = "";

    // all keys present in data rows
    const columns = Array.from(new Set(data.flatMap((r) => Object.keys(r))));

    // display labels as final name only (drop any prefix and array indices)
    const display = columns.map((c) => {
      let d = c.replace(/^result\./, "");
      // remove numeric indexes like [0]
      d = d.replace(/\[[0-9]+\]/g, "");
      // keep text after last dot
      const idx = d.lastIndexOf(".");
      if (idx !== -1) d = d.slice(idx + 1);
      return d;
    });

    // show total count above table if desired
    const countRow = document.getElementById("countRow");
    if (countRow) {
      countRow.textContent = `Total records: ${data.length}`;
    }

    /* create table header */
    tableHead.innerHTML =
      "<tr>" + display.map((col) => `<th>${col}</th>`).join("") + "</tr>";

    /* create table rows */
    data.forEach((row) => {
      const tr =
        "<tr>" +
        columns
          .map((col) => {
            let val = row[col];
            if (val === null || val === undefined) {
              return `<td>-</td>`;
            }
            if (typeof val === "object") {
              // pretty-print object
              try {
                val = JSON.stringify(val);
              } catch (e) {
                val = String(val);
              }
            }
            return `<td>${val}</td>`;
          })
          .join("") +
        "</tr>";
      tableBody.insertAdjacentHTML("beforeend", tr);
    });
  } catch (err) {
    console.error(err);

    tableBody.innerHTML = `<tr><td>Error: ${err.message}</td></tr>`;
  }
}

/* SEARCH */

document.getElementById("search").addEventListener("keyup", function () {
  const value = this.value.toLowerCase();

  document.querySelectorAll("#payoutTable tbody tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
});

/* EXPORT EXCEL */

function exportExcel() {
  const table = document.getElementById("payoutTable");

  const html = table.outerHTML;

  const url = "data:application/vnd.ms-excel," + encodeURIComponent(html);

  const a = document.createElement("a");

  a.href = url;

  a.download = "payout-report.xls";

  a.click();
}
