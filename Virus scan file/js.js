const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");

const fileInfo = document.getElementById("fileInfo");
const progress = document.getElementById("progress");
const scanStatus = document.getElementById("scanStatus");
const results = document.getElementById("results");

const BACKEND_URL = "https://cyberscan-backend.thanurin8.workers.dev/";

/* ---------------- FILE EVENTS ---------------- */

dropArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
    handleFile(e.target.files?.[0]);
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
});

/* ---------------- HANDLE FILE ---------------- */

function handleFile(file) {
    if (!file) return;

    fileInfo.style.display = "block";

    document.getElementById("fileName").innerText = file.name;
    document.getElementById("fileSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";

    scanStatus.innerText = "Uploading...";

    progress.style.width = "100%";

    uploadToBackend(file);
}

/* ---------------- BACKEND ---------------- */

async function uploadToBackend(file) {
    try {

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Backend error");
        }

        scanStatus.innerText = "Scan completed";

        showResults(file, data);

    } catch (err) {
        console.error(err);
        scanStatus.innerText = "Scan failed";
        alert(err.message);
    }
}

/* ---------------- RESULTS ---------------- */

function showResults(file, data) {

    results.style.display = "block";

    const malicious = data.malicious || 0;
    const harmless = data.harmless || 0;
    const total = malicious + harmless;

    const isDanger = malicious > 0;

    document.getElementById("finalResult").innerText =
        isDanger ? "DANGEROUS" : "SAFE";

    document.getElementById("statusText").innerText =
        isDanger ? "Malware Detected" : "Clean";

    document.getElementById("ratio").innerText =
        `${malicious} / ${total}`;

    document.getElementById("fileType").innerText =
        file.name.split('.').pop().toUpperCase();

    document.getElementById("finalSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";
}
