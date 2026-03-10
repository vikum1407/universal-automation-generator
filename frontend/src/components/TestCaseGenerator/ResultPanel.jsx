import React, { useState, useEffect, useRef } from "react";
import SkeletonCard from "./SkeletonCard";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import TestCaseEditModal from "./TestCaseEditModal";
import TestCaseHistoryModal from "./TestCaseHistoryModal";
import { generateTestCases } from "../../api/aiClient";

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

const toCSV = (results) => {
  const header = "Test Case,Description,Steps,Expected Result\n";

  const rows = results
    .map((tc, index) => {
      const steps = tc.steps ? tc.steps.join(" | ") : "";
      return `"${tc.title || `Test Case ${index + 1}`}",` +
             `"${tc.description || ""}",` +
             `"${steps}",` +
             `"${tc.expectedResult || ""}"`;
    })
    .join("\n");

  return header + rows;
};

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

export default function ResultPanel({
  results,
  setResults,
  clearResults,
  regenerateSingle,
  loading
}) {
  const panelRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [historyCase, setHistoryCase] = useState(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 200);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleAIEdit = async (instructions) => {
    const original = results[editingIndex];

    const payload = {
      input: original.description || "",
      context: instructions,
      sourceType: "TEXT",
      provider: "groq"
    };

    const updated = await generateTestCases(payload);

    setResults((prev) => {
      const copy = [...prev];
      const prevTc = copy[editingIndex];
      const history = prevTc.history ? [...prevTc.history, prevTc] : [prevTc];
      copy[editingIndex] = { ...updated[0], history };
      return copy;
    });

    setEditingIndex(null);
    toast.success("Test case updated");
  };

  const handleCopyAll = () => {
    const text = results
      .map((tc, index) => formatTestCase(tc, index))
      .join("\n\n-------------------------\n\n");

    navigator.clipboard.writeText(text);
    toast.success("All test cases copied");
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json"
    });
    saveAs(blob, "test-cases.json");
  };

  const downloadMD = () => {
    const blob = new Blob([toMarkdown(results)], { type: "text/markdown" });
    saveAs(blob, "test-cases.md");
  };

  const downloadZIP = async () => {
    const zip = new JSZip();

    zip.file("test-cases.json", JSON.stringify(results, null, 2));
    zip.file("test-cases.md", toMarkdown(results));
    zip.file("test-cases.csv", toCSV(results));

    zip.file(
      "metadata.txt",
      `Generated: ${new Date().toLocaleString()}\nTotal Test Cases: ${results.length}`
    );

    const folder = zip.folder("individual");

    results.forEach((tc, index) => {
      const md = formatTestCase(tc, index);
      folder.file(`test-case-${index + 1}.md`, md);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "test-cases.zip");

    toast.success("ZIP exported");
  };

  if (loading) {
    return (
      <div className="result-panel" ref={panelRef}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!results || results.length === 0) return null;

  return (
    <div className="result-panel" ref={panelRef}>
      <div className="sticky-export-bar">
        <button className="copy-all-btn" onClick={handleCopyAll}>
          Copy All
        </button>
        <button className="export-btn" onClick={downloadJSON}>
          JSON
        </button>
        <button className="export-btn" onClick={downloadMD}>
          MD
        </button>
        <button className="export-btn zip" onClick={downloadZIP}>
          ZIP
        </button>
        <button className="export-btn danger" onClick={clearResults}>
          Clear
        </button>
      </div>

      {results.map((tc, index) => (
        <div className="test-case-card" key={index}>
          <div className="card-header">
            <div className="card-title">
              <h3>{tc.title || `Test Case ${index + 1}`}</h3>
            </div>

            <div className="card-actions">
              <button
                className="copy-btn"
                onClick={() => {
                  const text = formatTestCase(tc, index);
                  navigator.clipboard.writeText(text);
                  toast.success("Test case copied");
                }}
              >
                Copy
              </button>
              <button
                className="regen-btn"
                onClick={() => regenerateSingle(index)}
              >
                Regenerate
              </button>
              <button
                className="history-btn"
                onClick={() => setHistoryCase(tc)}
              >
                History
              </button>
              <button
                className="edit-btn"
                onClick={() => setEditingIndex(index)}
              >
                Edit with AI
              </button>
            </div>
          </div>

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
      ))}

      {editingIndex !== null && (
        <TestCaseEditModal
          testCase={results[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onSubmit={handleAIEdit}
        />
      )}

      {historyCase && (
        <TestCaseHistoryModal
          testCase={historyCase}
          formatTestCase={formatTestCase}
          onClose={() => setHistoryCase(null)}
        />
      )}

      {showScrollTop && (
        <button
          className="scroll-top-btn"
          onClick={() =>
            panelRef.current.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          ↑
        </button>
      )}
    </div>
  );
}
