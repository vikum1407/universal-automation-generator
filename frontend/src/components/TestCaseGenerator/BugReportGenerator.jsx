import React, { useState } from "react";
import ProviderSelector from "./ProviderSelector";
import { generateTestCases } from "../../api/aiClient";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

const toMarkdown = (bug) => {
  if (!bug) return "";
  return [
    `# ${bug.title || "Bug Report"}`,
    "",
    `**Severity:** ${bug.severity || "Unspecified"}`,
    bug.environment ? `**Environment:** ${bug.environment}` : "",
    "",
    "## Steps to Reproduce",
    bug.steps && bug.steps.length
      ? bug.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "- Not specified",
    "",
    "## Expected Result",
    bug.expectedResult || "- Not specified",
    "",
    "## Actual Result",
    bug.actualResult || "- Not specified",
    "",
    bug.attachments && bug.attachments.length
      ? "## Attachments\n" + bug.attachments.map((a) => `- ${a}`).join("\n")
      : "",
    bug.suggestedFix
      ? `\n## Suggested Fix\n${bug.suggestedFix}`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
};

export default function BugReportGenerator({ provider, setProvider }) {
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [environment, setEnvironment] = useState("");
  const [severityHint, setSeverityHint] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [bug, setBug] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim() && !steps.trim()) {
      toast.error("Provide at least a description or steps.");
      return;
    }

    setLoading(true);

    try {
      const contextParts = [
        "Generate a Jira-style bug report with fields: title, severity, environment, steps (array), expectedResult, actualResult, attachments (array of strings), suggestedFix.",
        severityHint !== "auto"
          ? `Use severity: ${severityHint.toUpperCase()}.`
          : "Infer severity based on impact.",
        environment
          ? `Environment: ${environment}.`
          : "Environment may be generic if not specified."
      ].filter(Boolean);

      const payload = {
        input: description || steps,
        context: contextParts.join(" "),
        sourceType: "BUG_REPORT",
        provider
      };

      const data = await generateTestCases(payload);

      const bugObj = Array.isArray(data) ? data[0] : data;
      setBug(bugObj);
      toast.success("Bug report generated");
    } catch (e) {
      toast.error("Failed to generate bug report");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!bug) return;
    navigator.clipboard.writeText(toMarkdown(bug));
    toast.success("Bug report copied as Markdown");
  };

  const handleExportJSON = () => {
    if (!bug) return;
    const blob = new Blob([JSON.stringify(bug, null, 2)], {
      type: "application/json"
    });
    saveAs(blob, "bug-report.json");
  };

  const handleExportMD = () => {
    if (!bug) return;
    const md = toMarkdown(bug);
    const blob = new Blob([md], { type: "text/markdown" });
    saveAs(blob, "bug-report.md");
  };

  return (
    <div className="bug-container">
      <div className="bug-header">
        <h2>AI Bug Report Generator</h2>
        <p className="bug-subtitle">
          Generate Jira-style bug reports with severity, steps, expected vs actual, and more.
        </p>
      </div>

      <div className="bug-controls">
        <div className="bug-row">
          <div className="bug-field">
            <label>Provider</label>
            <ProviderSelector provider={provider} setProvider={setProvider} />
          </div>

          <div className="bug-field">
            <label>Severity hint</label>
            <select
              className="bug-select"
              value={severityHint}
              onChange={(e) => setSeverityHint(e.target.value)}
            >
              <option value="auto">Auto (let AI decide)</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="bug-field">
            <label>Environment</label>
            <input
              className="bug-input"
              placeholder="e.g., Chrome 121, Staging, Windows 11"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            />
          </div>
        </div>

        <div className="bug-field full">
          <label>Issue description</label>
          <textarea
            className="bug-textarea"
            placeholder="Describe the observed issue, symptoms, or error messages..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="bug-field full">
          <label>Steps to reproduce (optional)</label>
          <textarea
            className="bug-textarea"
            placeholder="1. Go to...\n2. Click on...\n3. Observe..."
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
          />
        </div>

        <div className="bug-actions">
          <button
            className="primary-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Bug Report"}
          </button>

          {bug && (
            <>
              <button className="export-btn" onClick={handleCopy}>
                Copy (Markdown)
              </button>
              <button className="export-btn" onClick={handleExportJSON}>
                Export JSON
              </button>
              <button className="export-btn" onClick={handleExportMD}>
                Export MD
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bug-result">
        {!bug ? (
          <p className="bug-empty">
            No bug report yet. Describe an issue and click &quot;Generate Bug Report&quot;.
          </p>
        ) : (
          <div className="bug-card">
            <div className="bug-card-header">
              <h3>{bug.title || "Bug Report"}</h3>
              <span className={`bug-severity badge-${(bug.severity || "unspecified").toLowerCase()}`}>
                {bug.severity || "Unspecified"}
              </span>
            </div>

            {bug.environment && (
              <p className="bug-env">
                <strong>Environment:</strong> {bug.environment}
              </p>
            )}

            <div className="bug-section">
              <h4>Steps to Reproduce</h4>
              {bug.steps && bug.steps.length ? (
                <ol>
                  {bug.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              ) : (
                <p className="bug-muted">Not specified</p>
              )}
            </div>

            <div className="bug-section">
              <h4>Expected Result</h4>
              <p>{bug.expectedResult || "Not specified"}</p>
            </div>

            <div className="bug-section">
              <h4>Actual Result</h4>
              <p>{bug.actualResult || "Not specified"}</p>
            </div>

            {bug.attachments && bug.attachments.length > 0 && (
              <div className="bug-section">
                <h4>Attachments</h4>
                <ul>
                  {bug.attachments.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {bug.suggestedFix && (
              <div className="bug-section">
                <h4>Suggested Fix</h4>
                <p>{bug.suggestedFix}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
