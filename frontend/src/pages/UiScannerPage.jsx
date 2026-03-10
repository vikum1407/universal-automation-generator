import React, { useState } from "react";
import { runUiScan } from "../api/uiClient";

export default function UiScannerPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await runUiScan(url, "qlitz-output");
      setResult(res.data);
    } catch (err) {
      console.error("UI scan failed:", err);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>UI Scanner & Test Generator</h2>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
        style={{ width: "400px", padding: "8px" }}
      />

      <button onClick={handleRun} disabled={loading} style={{ marginLeft: 10 }}>
        {loading ? "Scanning..." : "Scan UI"}
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>Flow Graph</h3>
          <pre>{JSON.stringify(result.flowGraph, null, 2)}</pre>

          <h3>Generated Test Files</h3>
          <ul>
            {result.testFiles.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>

          <h3>RTM</h3>
          <pre>{JSON.stringify(result.rtm, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
