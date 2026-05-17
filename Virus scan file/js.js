const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");

const fileInfo = document.getElementById("fileInfo");
const progress = document.getElementById("progress");
const scanStatus = document.getElementById("scanStatus");
const results = document.getElementById("results");

const BACKEND_URL = "https://cyberscan-backend.thanurin8.workers.dev";

/* ---------------- FILE ---------------- */

dropArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
    handleFile(e.target.files?.[0]);
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
});

/* ---------------- HANDLE ---------------- */

function handleFile(file) {
    if (!file) return;

    fileInfo.style.display = "block";

    document.getElementById("fileName").innerText = file.name;
    document.getElementById("fileSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";

    scanStatus.innerText = "Starting scan...";
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

        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error("Invalid backend response");
        }

        if (!res.ok) {
            throw new Error(data.error || "Backend error");
        }

        if (data.status === "PENDING") {
            scanStatus.innerText = "Scan started...";
            showPending(file, data.analysisId);
        }

    } catch (err) {
        console.error(err);
        scanStatus.innerText = "Scan failed";
        alert(err.message);
    }
}

/* ---------------- CHECK RESULT ---------------- */

async function showPending(file, analysisId) {

    results.style.display = "block";

    document.getElementById("finalResult").innerText = "SCANNING";
    document.getElementById("statusText").innerText = "Processing...";

    const interval = setInterval(async () => {

        try {
            const res = await fetch(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                {
                    headers: {
                        "x-apikey": "YOUR_VT_API_KEY"
                    }
                }
            );

            const data = await res.json();

            if (data?.data?.attributes?.status === "completed") {

                clearInterval(interval);

                const stats = data.data.attributes.stats;

                showResult(file, stats);
            }

        } catch (e) {
            console.log("waiting...");
        }

    }, 5000);
}

/* ---------------- RESULT ---------------- */

function showResult(file, stats) {

    const malicious = stats.malicious || 0;
    const harmless = stats.harmless || 0;
    const total = malicious + harmless;

    document.getElementById("finalResult").innerText =
        malicious > 0 ? "DANGEROUS" : "SAFE";

    document.getElementById("statusText").innerText =
        malicious > 0 ? "Malware Detected" : "Clean";

    document.getElementById("ratio").innerText =
        `${malicious} / ${total}`;

    document.getElementById("fileType").innerText =
        file.name.split('.').pop().toUpperCase();

    document.getElementById("finalSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";
}
