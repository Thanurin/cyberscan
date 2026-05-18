const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");

const fileInfo = document.getElementById("fileInfo");
const progress = document.getElementById("progress");
const scanStatus = document.getElementById("scanStatus");
const results = document.getElementById("results");

const BACKEND_URL = "https://cyberscan-backend.thanurin8.workers.dev/";

// CLICK EVENTS
dropArea.addEventListener("click", () => fileInput.click());
uploadBtn.addEventListener("click", () => fileInput.click());

// FILE SELECT
fileInput.addEventListener("change", (e) => {
    handleFile(e.target.files?.[0]);
});

// DRAG DROP
dropArea.addEventListener("dragover", (e) => e.preventDefault());

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
});

function handleFile(file) {
    if (!file) return;

    fileInfo.style.display = "block";

    document.getElementById("fileName").innerText = file.name;
    document.getElementById("fileSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";

    progress.style.width = "30%";
    scanStatus.innerText = "Uploading...";

    uploadToBackend(file);
}

async function uploadToBackend(file) {
    try {

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        progress.style.width = "100%";

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

function showResults(file, data) {

    results.style.display = "block";

    const malicious = data.malicious || 0;
    const suspicious = data.suspicious || 0;
    const harmless = data.harmless || 0;
    const undetected = data.undetected || 0;

    const total = malicious + suspicious + harmless + undetected;

    const isDanger = malicious > 0 || suspicious > 0;

    document.getElementById("finalResult").innerText =
        isDanger ? "DANGEROUS" : "SAFE";

    document.getElementById("statusText").innerText =
        isDanger ? "Malware Detected" : "Clean";

    document.getElementById("ratio").innerText =
        `${malicious + suspicious} / ${total}`;

    document.getElementById("fileType").innerText =
        file.name.split('.').pop().toUpperCase();

    document.getElementById("finalSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";
}
