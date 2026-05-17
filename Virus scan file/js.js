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

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Backend error");
        }

        if (data.status === "PENDING") {
            scanStatus.innerText = "Scan started... processing";

            // show instant result screen
            showPending(file, data.analysisId);

            return;
        }

    } catch (err) {
        console.error(err);
        scanStatus.innerText = "Scan failed";
        alert(err.message);
    }
}

/* ---------------- PENDING UI ---------------- */

function showPending(file, analysisId) {

    results.style.display = "block";

    document.getElementById("finalResult").innerText = "SCANNING";
    document.getElementById("statusText").innerText = "Scan in progress...";
    document.getElementById("ratio").innerText = "Waiting...";

    // optional auto-check every 5 seconds
    setInterval(async () => {

        try {
            const res = await fetch(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                {
                    headers: {
                        "x-apikey": "8d7cf6f90ab67ef44182536d2908e19536365d3c66e33e630115dc9a5737be17" // optional if you proxy it later
                    }
                }
            );

            const data = await res.json();

            if (data?.data?.attributes?.status === "completed") {

                const stats = data.data.attributes.stats;

                showFinal(file, stats);
            }

        } catch (e) {
            console.log("still scanning...");
        }

    }, 5000);
}

/* ---------------- FINAL RESULT ---------------- */

function showFinal(file, data) {

    const malicious = data.malicious || 0;
    const harmless = data.harmless || 0;
    const suspicious = data.suspicious || 0;

    const total = malicious + harmless + suspicious;

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
