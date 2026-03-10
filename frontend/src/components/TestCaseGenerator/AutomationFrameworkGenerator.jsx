import React, { useState } from "react";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

export default function AutomationFrameworkGenerator() {
  const [framework, setFramework] = useState("selenium");
  const [language, setLanguage] = useState("java");
  const [pattern, setPattern] = useState("pom");
  const [moduleType, setModuleType] = useState("ui");
  const [projectName, setProjectName] = useState("automation-framework");
  const [metadata, setMetadata] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleGenerate = async () => {
    if (!metadata.trim()) {
      toast.error("Provide metadata (pages, endpoints, scenarios, etc.)");
      return;
    }

    setLoading(true);

    try {
      // 🔗 This is where your engine will plug in later.
      // For now, we mock a response to validate the UI contract.
      const mock = {
        projectName,
        framework,
        language,
        pattern,
        moduleType,
        files: [
          {
            path: "src/test/java/com/example/pages/LoginPage.java",
            content: "// TODO: generated POM class"
          },
          {
            path: "src/test/java/com/example/tests/LoginTest.java",
            content: "// TODO: generated test class"
          }
        ]
      };

      setPreview(mock);
      toast.success("Framework structure generated (mock)");
    } catch (e) {
      toast.error("Failed to generate framework");
    } finally {
      setLoading(false);
    }
  };

  const handleExportZip = () => {
    if (!preview) return;
    // For now, export JSON; later this will be a real ZIP from backend.
    const blob = new Blob([JSON.stringify(preview, null, 2)], {
      type: "application/json"
    });
    saveAs(blob, `${preview.projectName || "framework"}.json`);
  };

  return (
    <div className="afw-container">
      <div className="afw-header">
        <h2>Automation Framework Generator</h2>
        <p className="afw-subtitle">
          Design multi-language, multi-framework automation scaffolds with POM, API, BDD, and suite structure.
        </p>
      </div>

      <div className="afw-controls">
        <div className="afw-row">
          <div className="afw-field">
            <label>Project name</label>
            <input
              className="afw-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., ecommerce-ui-automation"
            />
          </div>

          <div className="afw-field">
            <label>Framework</label>
            <select
              className="afw-select"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
            >
              <option value="selenium">Selenium</option>
              <option value="playwright">Playwright</option>
              <option value="cypress">Cypress</option>
              <option value="rest-assured">REST Assured</option>
            </select>
          </div>

          <div className="afw-field">
            <label>Language</label>
            <select
              className="afw-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="java">Java</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="csharp">C#</option>
            </select>
          </div>
        </div>

        <div className="afw-row">
          <div className="afw-field">
            <label>Pattern</label>
            <select
              className="afw-select"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            >
              <option value="pom">Page Object Model</option>
              <option value="bdd">BDD (Gherkin + Steps)</option>
              <option value="api">API Test Suite</option>
              <option value="hybrid">Hybrid (UI + API)</option>
            </select>
          </div>

          <div className="afw-field">
            <label>Module type</label>
            <select
              className="afw-select"
              value={moduleType}
              onChange={(e) => setModuleType(e.target.value)}
            >
              <option value="ui">UI Tests</option>
              <option value="api">API Tests</option>
              <option value="e2e">End-to-End</option>
            </select>
          </div>
        </div>

        <div className="afw-field full">
          <label>Metadata (pages, endpoints, scenarios)</label>
          <textarea
            className="afw-textarea"
            placeholder={`Example:
pages:
  - name: LoginPage
    url: /login
    elements:
      - name: username
        locator: #username
      - name: password
        locator: #password
      - name: loginButton
        locator: button[type=submit]
`}
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
          />
        </div>

        <div className="afw-actions">
          <button
            className="primary-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Framework"}
          </button>

          {preview && (
            <button className="export-btn" onClick={handleExportZip}>
              Export (JSON for now)
            </button>
          )}
        </div>
      </div>

      <div className="afw-result">
        {!preview ? (
          <p className="afw-empty">
            No framework generated yet. Configure options and click &quot;Generate Framework&quot;.
          </p>
        ) : (
          <div className="afw-preview">
            <h3>Planned file structure</h3>
            <ul>
              {preview.files.map((f, i) => (
                <li key={i}>{f.path}</li>
              ))}
            </ul>
            <pre className="afw-code">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
