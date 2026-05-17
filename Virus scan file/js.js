const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");

const fileInfo = document.getElementById("fileInfo");
const progress = document.getElementById("progress");
const scanStatus = document.getElementById("scanStatus");
const results = document.getElementById("results");

const BACKEND_URL = "https://cyberscan-backend.thanurin8.workers.dev";

/* ---------------- EVENTS ---------------- */

dropArea.addEventListener("click", () => fileInput.click());

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

/* ---------------- FILE HANDLER ---------------- */

function handleFile(file) {
    if (!file) return;

    fileInfo.style.display = "block";

    document.getElementById("fileName").innerText = file.name;
    document.getElementById("fileSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";

    let percent = 0;
    scanStatus.innerText = "Uploading...";

    const timer = setInterval(() => {
        percent += 5;
        progress.style.width = percent + "%";

        if (percent >= 100) {
            clearInterval(timer);
            uploadToBackend(file);
        }
    }, 60);
}

/* ---------------- BACKEND CALL ---------------- */

async function uploadToBackend(file) {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData
        });

        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error("Server returned invalid response");
        }

        if (!res.ok) {
            throw new Error(data.error || "Backend error");
        }

        if (data.status === "TIMEOUT") {
            scanStatus.innerText = "Scan still processing. Try again.";
            return;
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

    const malicious = Number(data.malicious || 0);
    const harmless = Number(data.harmless || 0);
    const suspicious = Number(data.suspicious || 0);

    const total = malicious + harmless + suspicious;
    const isDanger = malicious > 0;

    const finalResult = document.getElementById("finalResult");
    const statusBadge = document.getElementById("statusBadge");

    if (isDanger) {
        finalResult.innerText = "DANGEROUS";
        finalResult.className = "danger";

        statusBadge.innerText = "Threat Found";
        statusBadge.className = "danger";

        document.getElementById("statusText").innerText = "Malware Detected";
    } else {
        finalResult.innerText = "SAFE";
        finalResult.className = "safe";

        statusBadge.innerText = "Clean";
        statusBadge.className = "safe";

        document.getElementById("statusText").innerText = "No Threats";
    }

    document.getElementById("ratio").innerText = `${malicious} / ${total}`;
    document.getElementById("fileType").innerText =
        file.name.split('.').pop().toUpperCase();
    document.getElementById("finalSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";
}
