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

    // Detect danger correctly
    const isDanger =
        malicious > 0 || suspicious > 0;

    document.getElementById("finalResult").innerText =
        isDanger ? "DANGEROUS" : "SAFE";

    document.getElementById("statusText").innerText =
        isDanger
            ? "Malware Detected"
            : "Clean";

    document.getElementById("ratio").innerText =
        `${malicious + suspicious} / ${total}`;

    document.getElementById("fileType").innerText =
        file.name.split('.').pop().toUpperCase();

    document.getElementById("finalSize").innerText =
        (file.size / 1024 / 1024).toFixed(2) + " MB";
}
