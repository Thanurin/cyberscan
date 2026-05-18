const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");

const fileInfo = document.getElementById("fileInfo");
const progress = document.getElementById("progress");
const scanStatus = document.getElementById("scanStatus");
const results = document.getElementById("results");

const BACKEND_URL = "https://cyberscan-backend.thanurin8.workers.dev/";

/* ---------------- INIT UI ---------------- */

// Make sure UI is reset on load
fileInfo.style.display = "none";
results.style.display = "none";
progress.style.width = "0%";

/* ---------------- FILE EVENTS ---------------- */

dropArea.addEventListener("click", () => {
    fileInput.value = ""; // reset so same file can re-upload
    fileInput.click();
});

fileInput.addEventListener("change", (e) => {
    handleFile(e.target.files?.[0]);
});

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
});

/* ---------------- HANDLE FILE ---------------- */

function handleFile(file) {
    if (!file) return;

    // reset UI when new file selected
    results.style.display = "none";

    fileInfo.style.display = "block";

    document.getElementById("fileName").innerText = file.name;
    document.getElementById("fileSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";

    scanStatus.innerText = "Uploading...";

    progress.style.width = "30%";

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

        progress.style.width = "100%";

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
    const suspicious = data.suspicious || 0;
    const harmless = data.harmless || 0;
    const undetected = data.undetected || 0;
    const timeout = data.timeout || 0;

    const total =
        malicious +
        suspicious +
        harmless +
        undetected +
        timeout;

    const isDanger =
        malicious > 0 || suspicious > 0;

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
