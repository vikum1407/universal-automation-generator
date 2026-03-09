import React from "react";

export default function ProviderSelector({ provider, setProvider }) {
  return (
    <div className="provider-selector">
      <label>AI Provider</label>
      <select value={provider} onChange={(e) => setProvider(e.target.value)}>
        <option value="groq">Groq (LLaMA 3.1)</option>
        <option value="deepseek">DeepSeek Chat</option>
      </select>
    </div>
  );
}
