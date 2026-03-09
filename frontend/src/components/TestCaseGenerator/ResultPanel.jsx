import React, { useState } from "react";
import SkeletonCard from "./SkeletonCard";
import toast from "react-hot-toast";

const downloadFile = (filename, content) => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};

const toMarkdown = (results) => {
  return results
    .map((tc, index) => {
      let md = `## Test Case ${index + 1}: ${tc.title || ""}\n\n`;

      if (tc.description) md += `**Description:**\n${tc.description}\n\n`;

      if (tc.steps) {
        md += `**Steps:**\n`;
        tc.steps.forEach((s, i) => {
          md += `${i + 1}. ${s}\n`;
        });
        md += `\n`;
      }

      if (tc.expectedResult) {
        md += `**Expected Result:**\n${tc.expectedResult}\n`;
      }

      return md;
    })
    .join("\n---\n\n");
};

export default function ResultPanel({
  results,
  clearResults,
  regenerateSingle,
  loading
}) {
  if (loading) {
    return (
      <div className="result-panel">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!results || results.length === 0) return null;

  const handleCopyAll = () => {
    if (!results || results.length === 0) {
      toast.error("No test cases to copy");
      return;
    }

    const text = results
      .map((tc, index) => formatTestCase(tc, index))
      .join("\n\n-------------------------\n\n");

    navigator.clipboard.writeText(text);
    toast.success("All test cases copied");
  };

  const downloadJSON = () => {
    downloadFile("test-cases.json", JSON.stringify(results, null, 2));
  };

  const downloadMD = () => {
    downloadFile("test-cases.md", toMarkdown(results));
  };

  return (
    <div className="result-panel">
      <div className="export-bar">
        <button className="copy-all-btn" onClick={handleCopyAll}>
          <svg width="16" height="16" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="2" />
            <path d="M8 6v4M6 8h4" />
          </svg>
          Copy All
        </button>

        <button className="export-btn" onClick={downloadJSON}>
          <svg width="16" height="16" fill="none" stroke="currentColor">
            <path d="M4 4h8v8H4z" />
            <path d="M8 2v4M6 4h4" />
          </svg>
          JSON
        </button>

        <button className="export-btn" onClick={downloadMD}>
          <svg width="16" height="16" fill="none" stroke="currentColor">
            <path d="M3 4h10M3 8h10M3 12h10" />
          </svg>
          MD
        </button>

        <button className="export-btn danger" onClick={clearResults}>
          <svg width="16" height="16" fill="none" stroke="currentColor">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
          Clear
        </button>
      </div>

      {results.map((tc, index) => (
        <CollapsibleCard
          key={index}
          tc={tc}
          index={index}
          regenerateSingle={regenerateSingle}
        />
      ))}
    </div>
  );
}

function CollapsibleCard({ tc, index, regenerateSingle }) {
  const [open, setOpen] = useState(false);

  const copyToClipboard = () => {
    const text = formatTestCase(tc, index);
    navigator.clipboard.writeText(text);
    toast.success("Test case copied");
  };

  return (
    <div className="test-case-card">
      <div className="card-header">
        <div className="card-title" onClick={() => setOpen(!open)}>
          <h3>{tc.title || `Test Case ${index + 1}`}</h3>
          <span className="toggle-icon">{open ? "▲" : "▼"}</span>
        </div>

        <div className="card-actions">
          <button className="copy-btn" onClick={copyToClipboard}>
            <svg width="16" height="16" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="10" height="10" rx="2" />
              <path d="M8 6v4M6 8h4" />
            </svg>
            Copy
          </button>

          <button className="regen-btn" onClick={() => regenerateSingle(index)}>
            <svg width="16" height="16" fill="none" stroke="currentColor">
              <path d="M4 8h8M8 4l4 4-4 4" />
            </svg>
            Regenerate
          </button>
        </div>
      </div>

      <div className={`card-body-wrapper ${open ? "open" : ""}`}>
        <div className="card-body">
          {tc.description && <p>{tc.description}</p>}

          {tc.steps && (
            <div className="steps">
              <h4>Steps</h4>
              <ol>
                {tc.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {tc.expectedResult && (
            <div className="expected">
              <h4>Expected Result</h4>
              <p>{tc.expectedResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTestCase(tc, index) {
  let output = `Test Case ${index + 1}: ${tc.title || ""}\n\n`;

  if (tc.description) {
    output += `Description:\n${tc.description}\n\n`;
  }

  if (tc.steps) {
    output += "Steps:\n";
    tc.steps.forEach((s, i) => {
      output += `${i + 1}. ${s}\n`;
    });
    output += "\n";
  }

  if (tc.expectedResult) {
    output += `Expected Result:\n${tc.expectedResult}\n`;
  }

  return output;
}
