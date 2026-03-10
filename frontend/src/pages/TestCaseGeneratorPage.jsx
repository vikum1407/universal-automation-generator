import React, { useState, useEffect, useRef, useCallback } from "react";
import InputPanel from "../components/TestCaseGenerator/InputPanel";
import ResultPanel from "../components/TestCaseGenerator/ResultPanel";
import ProviderSelector from "../components/TestCaseGenerator/ProviderSelector";
import TestDataGenerator from "../components/TestCaseGenerator/TestDataGenerator";
import BugReportGenerator from "../components/TestCaseGenerator/BugReportGenerator";
import AutomationFrameworkGenerator from "../components/TestCaseGenerator/AutomationFrameworkGenerator";
import { generateTestCases } from "../api/aiClient";
import "../components/TestCaseGenerator/TestCaseGenerator.css";
import toast from "react-hot-toast";

const formatTestCase = (tc, index) => {
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
};

export default function TestCaseGeneratorPage() {
  const [activeTab, setActiveTab] = useState("cases");

  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [provider, setProvider] = useState("groq");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const [autosaveStatus] = useState(null);
  const [lastSavedAt] = useState(null);

  const [theme, setTheme] = useState("light");

  const resultsRef = useRef(null);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  const regenerateSingle = async (index) => {
    const payload = {
      input,
      context,
      sourceType: "TEXT",
      provider
    };

    const data = await generateTestCases(payload);

    setResults((prev) => {
      const updated = [...prev];
      updated[index] = data[index] || updated[index];
      return updated;
    });
  };

  const onGenerate = useCallback(async () => {
    if (!input.trim()) {
      toast.error("Please enter a requirement or user story.");
      return;
    }

    setLoading(true);

    const payload = {
      input,
      context,
      sourceType: "TEXT",
      provider
    };

    const data = await generateTestCases(payload);
    setResults(data);

    setLoading(false);
  }, [input, context, provider]);

  useEffect(() => {
    if (results.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [results]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "Enter" && activeTab === "cases") {
        onGenerate();
      }

      if (e.key === "Escape" && activeTab === "cases") {
        clearResults();
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
        if (results.length > 0 && activeTab === "cases") {
          const text = results
            .map((tc, index) => formatTestCase(tc, index))
            .join("\n\n-------------------------\n\n");

          navigator.clipboard.writeText(text);
          toast.success("All test cases copied");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [results, clearResults, onGenerate, activeTab]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className={`page-root ${theme === "dark" ? "theme-dark" : ""}`}>
      <div className="module-tabs">
        <button
          className={`module-tab ${activeTab === "cases" ? "active" : ""}`}
          onClick={() => setActiveTab("cases")}
        >
          Test Cases
        </button>
        <button
          className={`module-tab ${activeTab === "data" ? "active" : ""}`}
          onClick={() => setActiveTab("data")}
        >
          Test Data
        </button>
        <button
          className={`module-tab ${activeTab === "bugs" ? "active" : ""}`}
          onClick={() => setActiveTab("bugs")}
        >
          Bug Reports
        </button>
        <button
          className={`module-tab ${activeTab === "framework" ? "active" : ""}`}
          onClick={() => setActiveTab("framework")}
        >
          Automation Framework
        </button>
      </div>

      {activeTab === "cases" && (
        <div className="page two-column">
          <div className="left-panel">
            <div className="theme-toggle">
              <span>Theme</span>
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleTheme}
              >
                {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
              </button>
            </div>

            <ProviderSelector provider={provider} setProvider={setProvider} />

            <div className="autosave-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={autosaveEnabled}
                  onChange={(e) => setAutosaveEnabled(e.target.checked)}
                />
                Autosave
              </label>
            </div>

            <InputPanel
              input={input}
              setInput={setInput}
              context={context}
              setContext={setContext}
              onGenerate={onGenerate}
              loading={loading}
            />

            {autosaveStatus === "saved" && (
              <div className="autosave-indicator">Draft saved</div>
            )}

            {lastSavedAt && (
              <div className="autosave-timestamp">
                Last saved at {new Date(lastSavedAt).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="right-panel" ref={resultsRef}>
            <ResultPanel
              results={results}
              setResults={setResults}
              clearResults={clearResults}
              regenerateSingle={regenerateSingle}
              loading={loading}
            />
          </div>
        </div>
      )}

      {activeTab === "data" && (
        <div className="page single-column">
          <TestDataGenerator provider={provider} setProvider={setProvider} />
        </div>
      )}

      {activeTab === "bugs" && (
        <div className="page single-column">
          <BugReportGenerator provider={provider} setProvider={setProvider} />
        </div>
      )}

      {activeTab === "framework" && (
        <div className="page single-column">
          <AutomationFrameworkGenerator />
        </div>
      )}
    </div>
  );
}
