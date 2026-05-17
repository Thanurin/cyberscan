require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());

const VT_API_KEY = process.env.VT_API_KEY;

/* ---------------- UPLOAD + SCAN ---------------- */

app.post("/scan", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;

        // 1. Upload file to VirusTotal
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath));

        const uploadRes = await axios.post(
            "https://www.virustotal.com/api/v3/files",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "x-apikey": VT_API_KEY,
                },
            }
        );

        const analysisId = uploadRes.data.data.id;

        // 2. Polling until analysis is done
        let result;
        let done = false;

        for (let i = 0; i < 10; i++) { // max 10 tries
            await new Promise(r => setTimeout(r, 3000));

            const analysisRes = await axios.get(
                `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
                {
                    headers: {
                        "x-apikey": VT_API_KEY,
                    },
                }
            );

            const status = analysisRes.data.data.attributes.status;

            if (status === "completed") {
                result = analysisRes.data.data.attributes.stats;
                done = true;
                break;
            }
        }

        // cleanup file
        fs.unlinkSync(filePath);

        if (!done) {
            return res.json({
                status: "TIMEOUT",
                message: "Scan still processing, try again"
            });
        }

        // 3. Return clean result
        res.json({
            malicious: result.malicious,
            harmless: result.harmless,
            suspicious: result.suspicious,
            timeout: result.timeout,
            undetected: result.undetected,
            status: result.malicious > 0 ? "DANGEROUS" : "SAFE"
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

/* ---------------- START SERVER ---------------- */

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`CyberScan running on port ${PORT}`);
});
