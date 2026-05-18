export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("POST only", { status: 405, headers: corsHeaders });
    }
const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");

const fileInfo = document.getElementById("fileInfo");
const progress = document.getElementById("progress");
const scanStatus = document.getElementById("scanStatus");
const results = document.getElementById("results");

const BACKEND_URL = "https://cyberscan-backend.thanurin8.workers.dev/";

// CLICK TO UPLOAD
dropArea.addEventListener("click", () => fileInput.click());

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

    scanStatus.innerText = "Uploading...";
    progress.style.width = "30%";

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
            throw new Error(data.error || "Upload failed");
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
    try {

      if (!env.VT_API_KEY) {
        return Response.json(
          { error: "Missing VT_API_KEY" },
          { status: 500, headers: corsHeaders }
        );
      }

      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return Response.json(
          { error: "No file uploaded" },
          { status: 400, headers: corsHeaders }
        );
      }

      // ---------------- UPLOAD ----------------
      const vtForm = new FormData();
      vtForm.append("file", file);

      const uploadRes = await fetch(
        "https://www.virustotal.com/api/v3/files",
        {
          method: "POST",
          headers: {
            "x-apikey": env.VT_API_KEY,
          },
          body: vtForm,
        }
      );

      const uploadText = await uploadRes.text();

      if (!uploadRes.ok) {
        return Response.json({
          error: "VirusTotal upload failed",
          status: uploadRes.status,
          details: uploadText
        }, { status: 500, headers: corsHeaders });
      }

      let uploadData;
      try {
        uploadData = JSON.parse(uploadText);
      } catch {
        return Response.json({
          error: "Invalid VirusTotal response",
          raw: uploadText
        }, { status: 500, headers: corsHeaders });
      }

      const analysisId = uploadData?.data?.id;

      if (!analysisId) {
        return Response.json({
          error: "No analysis ID returned",
          data: uploadData
        }, { status: 500, headers: corsHeaders });
      }

      // ---------------- ANALYSIS ----------------
      let stats = null;

      for (let i = 0; i < 15; i++) {

        await new Promise(r => setTimeout(r, 4000));

        const res = await fetch(
          `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
          {
            headers: {
              "x-apikey": env.VT_API_KEY,
            },
          }
        );

        const data = await res.json();
        const status = data?.data?.attributes?.status;

        if (status === "completed") {
          stats = data?.data?.attributes?.stats;
          break;
        }
      }

      if (!stats) {
        return Response.json({
          status: "TIMEOUT",
          message: "Scan not finished yet"
        }, { headers: corsHeaders });
      }

      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      const harmless = stats.harmless || 0;
      const undetected = stats.undetected || 0;

      const total = malicious + suspicious + harmless + undetected;

      return Response.json({
        status: (malicious > 0 || suspicious > 0) ? "DANGEROUS" : "SAFE",
        malicious,
        suspicious,
        harmless,
        undetected,
        total,
        fileName: file.name,
        fileSize: file.size
      }, { headers: corsHeaders });

    } catch (err) {
      return Response.json({
        error: "Worker crashed",
        message: err.message
      }, { status: 500, headers: corsHeaders });
    }
  }
};
