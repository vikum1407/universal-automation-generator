import React, { useState, useMemo } from "react";

function diffLines(oldText, newText) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const max = Math.max(oldLines.length, newLines.length);
  const result = [];

  for (let i = 0; i < max; i++) {
    const oldLine = oldLines[i] ?? "";
    const newLine = newLines[i] ?? "";

    if (oldLine === newLine) {
      result.push({ type: "context", text: oldLine });
    } else {
      if (oldLine) result.push({ type: "removed", text: oldLine });
      if (newLine) result.push({ type: "added", text: newLine });
    }
  }

  return result;
}

export default function TestCaseHistoryModal({
  testCase,
  formatTestCase,
  onClose
}) {
  const history = testCase.history || [];
  const [selectedIndex, setSelectedIndex] = useState(history.length - 1);

  const selectedVersion = history[selectedIndex] || null;

  const diff = useMemo(() => {
    if (!selectedVersion) return [];
    const oldText = formatTestCase(selectedVersion, 0);
    const newText = formatTestCase(testCase, 0);
    return diffLines(oldText, newText);
  }, [selectedVersion, testCase, formatTestCase]);

  return (
    <div className="modal-backdrop">
      <div className="modal modal-history">
        <div className="modal-header-row">
          <h3>Version History</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="modal-subtitle">
          Compare previous versions of this test case with the current one.
        </p>

        {history.length === 0 ? (
          <p className="no-history">No previous versions yet.</p>
        ) : (
          <div className="history-layout">
            <div className="history-list">
              {history.map((v, idx) => (
                <button
                  key={idx}
                  className={`history-item ${
                    idx === selectedIndex ? "active" : ""
                  }`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  Version {idx + 1}
                </button>
              ))}
            </div>

            <div className="history-diff">
              {diff.map((line, i) => (
                <pre
                  key={i}
                  className={`diff-line diff-${line.type}`}
                >
                  {line.type === "added" && "+ "}
                  {line.type === "removed" && "- "}
                  {line.type === "context" && "  "}
                  {line.text}
                </pre>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
