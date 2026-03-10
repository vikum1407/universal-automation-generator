import React from "react";

export default function InputPanel({
  input,
  setInput,
  context,
  setContext,
  onGenerate,
  loading
}) {
  return (
    <div className="input-panel">
      <h2 className="generator-title">AI Test Case Generator</h2>

      <textarea
        className="input-textarea"
        placeholder="Enter requirement or user story..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <textarea
        className="input-textarea"
        placeholder="Optional context (tech stack, constraints, etc.)"
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />

      <div className="sticky-generate-bar">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="primary-btn"
        >
          {loading ? <span className="spinner"></span> : "Generate Test Cases"}
        </button>
      </div>
    </div>
  );
}
