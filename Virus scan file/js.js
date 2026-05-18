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
