let processedText = "";

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const resultDiv = document.getElementById("result");
const downloadButton = document.getElementById("downloadButton");

// --- Sự kiện kéo thả / click vùng dropzone ---
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("dragover")
);

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
  }
});

// --- Sự kiện chọn file từ input ---
fileInput.addEventListener("change", () => checkDuplicate());

// --- Hàm kiểm tra trùng lặp ---
function checkDuplicate() {
  if (!fileInput.files.length) {
    displayMessage(resultDiv, "Vui lòng chọn file.", "error");
    return;
  }
  const file = fileInput.files[0];
  const ext = file.name.toLowerCase().split(".").pop();

  if (ext === "docx") readDocx(file);
  else if (ext === "txt") readTxt(file);
  else if (ext === "xlsx") readExcel(file);
  else if (ext === "pdf") readPdf(file);
  else
    displayMessage(resultDiv, "Chỉ hỗ trợ .txt, .docx, .xlsx, .pdf", "error");
}

// --- Đọc các loại file ---
function readDocx(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    mammoth
      .extractRawText({ arrayBuffer: e.target.result })
      .then((r) => processText(r.value))
      .catch(() => displayMessage(resultDiv, "Lỗi đọc Word", "error"));
  };
  reader.readAsArrayBuffer(file);
}

function readTxt(file) {
  const reader = new FileReader();
  reader.onload = (e) => processText(e.target.result);
  reader.readAsText(file);
}

function readExcel(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const text = XLSX.utils
      .sheet_to_json(sheet, { header: 1 })
      .map((r) => r.join(" "))
      .join("\n");
    processText(text);
  };
  reader.readAsArrayBuffer(file);
}

function readPdf(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(e.target.result))
      .promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      content.items.forEach((it) => (text += it.str + " "));
    }
    processText(text);
  };
  reader.readAsArrayBuffer(file);
}

// --- Xử lý trùng lặp ---
function processText(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  const seen = new Map();
  const duplicates = [];

  lines.forEach((l, idx) => {
    const key = l
      .replace(/^\d+\.\s*/, "")
      .replace(/[^\w\s]/g, "")
      .toLowerCase();
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push({ line: l, idx: idx + 1 });
  });

  seen.forEach((arr) => {
    if (arr.length > 1) {
      const nums = arr.map((a) => a.idx).join(", ");
      const full = arr.map((a) => `Dòng ${a.idx}: ${a.line}`).join("<br>");
      const short = arr[0].line.split("?")[0].trim();
      duplicates.push({ nums, full, short });
    }
  });

  if (duplicates.length) {
    resultDiv.innerHTML = duplicates
      .map(
        (d, i) => `
          <div class="duplicate-card">
            <div class="duplicate-header">
              <i class="fas fa-clone"></i> Trùng lặp ${i + 1} – dòng: ${d.nums}
            </div>
            <div class="duplicate-short"><strong>Gốc:</strong> ${d.short}</div>
            <div class="duplicate-full"><strong>Chi tiết:</strong><br>${
              d.full
            }</div>
          </div>
        `
      )
      .join("");
    processedText = lines.join("\n");
    downloadButton.style.display = "inline-flex";
  } else {
    displayMessage(resultDiv, "Không có phần trùng lặp nào.");
    downloadButton.style.display = "none";
  }
}

// --- Hiển thị lỗi / text ---
function displayMessage(el, msg, type = "") {
  el.className = type === "error" ? "error" : "result";
  el.innerHTML = msg;
}

// --- Xuất file ---
function downloadFile() {
  if (!processedText) return alert("Không có dữ liệu để tải.");
  const ext = fileInput.files[0].name.split(".").pop().toLowerCase();
  const lines = processedText.split("\n");
  if (ext === "xlsx")
    exportToExcel(lines, "cleaned_" + fileInput.files[0].name);
  else {
    const b = new Blob([processedText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download =
      "cleaned_" + fileInput.files[0].name.replace(/\.[^/.]+$/, "") + ".txt";
    a.click();
  }
}
