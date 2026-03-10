import React, { useState } from "react";
import ProviderSelector from "./ProviderSelector";
import { generateTestCases } from "../../api/aiClient";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

const buildCSV = (rows) => {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const lines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h] ?? "";
        const safe = String(val).replace(/"/g, '""');
        return `"${safe}"`;
      })
      .join(",")
  );
  return [headerLine, ...lines].join("\n");
};

export default function TestDataGenerator({ provider, setProvider }) {
  const [instructions, setInstructions] = useState("");
  const [format, setFormat] = useState("json");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [rawText, setRawText] = useState("");

  const handleGenerate = async () => {
    if (!instructions.trim()) {
      toast.error("Please describe the test data you want.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        input: instructions,
        context: `Generate structured test data as an array of JSON objects.`,
        sourceType: "TEST_DATA",
        provider,
        format
      };

      const data = await generateTestCases(payload);

      // Expecting an array of objects
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("AI did not return structured data. Check backend mapping.");
        setLoading(false);
        return;
      }

      setRows(data);
      setRawText(JSON.stringify(data, null, 2));
      toast.success("Test data generated");
    } catch (e) {
      toast.error("Failed to generate test data");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (format === "json") {
      navigator.clipboard.writeText(rawText);
    } else if (format === "csv") {
      navigator.clipboard.writeText(buildCSV(rows));
    } else {
      navigator.clipboard.writeText(rawText);
    }
    toast.success("Copied");
  };

  const handleExport = () => {
    if (format === "json") {
      const blob = new Blob([rawText], { type: "application/json" });
      saveAs(blob, "test-data.json");
    } else if (format === "csv") {
      const csv = buildCSV(rows);
      const blob = new Blob([csv], { type: "text/csv" });
      saveAs(blob, "test-data.csv");
    } else {
      const blob = new Blob([rawText], { type: "text/plain" });
      saveAs(blob, "test-data.txt");
    }
  };

  const renderTable = () => {
    if (!rows || rows.length === 0) return null;
    const headers = Object.keys(rows[0]);

    return (
      <div className="testdata-table-wrapper">
        <table className="testdata-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {headers.map((h) => (
                  <td key={h}>{String(row[h] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="testdata-container">
      <div className="testdata-header">
        <h2>AI Test Data Generator</h2>
        <p className="testdata-subtitle">
          Generate realistic, structured test data for your scenarios in JSON, CSV, or table form.
        </p>
      </div>

      <div className="testdata-controls">
        <div className="testdata-row">
          <div className="testdata-field">
            <label>Provider</label>
            <ProviderSelector provider={provider} setProvider={setProvider} />
          </div>

          <div className="testdata-field">
            <label>Output format</label>
            <select
              className="testdata-select"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="table">Table</option>
            </select>
          </div>
        </div>

        <div className="testdata-field full">
          <label>Describe the test data you need</label>
          <textarea
            className="testdata-textarea"
            placeholder="Example: Generate 50 fake users with name, email, role, and country..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="testdata-actions">
          <button
            className="primary-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Test Data"}
          </button>

          {rows.length > 0 && (
            <>
              <button className="export-btn" onClick={handleCopy}>
                Copy
              </button>
              <button className="export-btn" onClick={handleExport}>
                Export
              </button>
            </>
          )}
        </div>
      </div>

      <div className="testdata-result">
        {rows.length === 0 ? (
          <p className="testdata-empty">
            No test data yet. Describe what you need and click &quot;Generate Test Data&quot;.
          </p>
        ) : format === "table" ? (
          renderTable()
        ) : (
          <pre className="testdata-code">
            {format === "json" ? rawText : buildCSV(rows)}
          </pre>
        )}
      </div>
    </div>
  );
}
