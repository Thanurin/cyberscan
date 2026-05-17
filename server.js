const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🟢 Test route
app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

// 🟢 File scan route
app.post("/scan", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Fake scan logic (replace later with real API like VirusTotal)
    const fakeResult = {
      filename: req.file.originalname,
      status: "clean",
      threats: 0,
      message: "File scanned successfully",
    };

    res.json({
      success: true,
      result: fakeResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Backend error",
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});