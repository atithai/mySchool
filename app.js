// 1) หลัง deploy Google Apps Script แล้ว ให้นำ Web App URL มาใส่ตรงนี้
const API_URL = "https://script.google.com/macros/s/AKfycbwPpHSY6MmuojxTH1lUMF8xbwVk1kA2hk76UrexFE4FAARnObV22CdCuywzHwU2tTZt/exec";

const form = document.getElementById("studentForm");
const tableBody = document.getElementById("tableBody");
const statusEl = document.getElementById("status");

function setStatus(message) {
  statusEl.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function driveImageUrl(urlOrId) {
  if (!urlOrId) return "";
  const value = String(urlOrId).trim();
  if (value.startsWith("http")) return value;
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(value)}&sz=w300`;
}

async function api(action, options = {}) {
  if (API_URL.includes("PASTE_YOUR")) {
    throw new Error("กรุณาใส่ Google Apps Script Web App URL ใน app.js ก่อน");
  }

  const url = new URL(API_URL);
  url.searchParams.set("action", action);

  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
  return data;
}

async function loadData() {
  try {
    setStatus("กำลังโหลด...");
    const result = await api("list");
    renderRows(result.data);
    setStatus(`พบข้อมูล ${result.data.length} รายการ`);
  } catch (error) {
    setStatus(error.message);
  }
}

function renderRows(rows) {
  tableBody.innerHTML = rows.map(item => {
    const image = driveImageUrl(item.imageUrl);
    return `
      <tr>
        <td>${image ? `<img class="thumb" src="${escapeHtml(image)}" alt="">` : "-"}</td>
        <td>${escapeHtml(item.id)}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.age)}</td>
        <td>
          <button onclick='editRow(${JSON.stringify(item)})'>แก้ไข</button>
          <button class="danger" onclick='deleteRow(${JSON.stringify(item.row)})'>ลบ</button>
        </td>
      </tr>`;
  }).join("");
}

window.editRow = function(item) {
  document.getElementById("row").value = item.row;
  document.getElementById("id").value = item.id;
  document.getElementById("name").value = item.name;
  document.getElementById("age").value = item.age;
  document.getElementById("imageUrl").value = item.imageUrl || "";
  window.scrollTo({top: 0, behavior: "smooth"});
};

window.deleteRow = async function(row) {
  if (!confirm("ต้องการลบรายการนี้หรือไม่?")) return;

  try {
    setStatus("กำลังลบ...");
    await api("delete", {
      method: "POST",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify({row})
    });
    await loadData();
  } catch (error) {
    setStatus(error.message);
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    row: document.getElementById("row").value,
    id: document.getElementById("id").value.trim(),
    name: document.getElementById("name").value.trim(),
    age: document.getElementById("age").value,
    imageUrl: document.getElementById("imageUrl").value.trim()
  };

  try {
    setStatus("กำลังบันทึก...");
    await api(payload.row ? "update" : "create", {
      method: "POST",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify(payload)
    });
    form.reset();
    document.getElementById("row").value = "";
    await loadData();
  } catch (error) {
    setStatus(error.message);
  }
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  form.reset();
  document.getElementById("row").value = "";
});

document.getElementById("reloadBtn").addEventListener("click", loadData);
loadData();
