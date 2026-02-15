import React, { useState } from "react";
import axios from "axios";

export default function GeneratePage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [requestJson, setRequestJson] = useState("{}");
  const [responseJson, setResponseJson] = useState("{}");
  const [framework, setFramework] = useState("SELENIUM");
  const [language, setLanguage] = useState("JAVA");
  const [generatedCode, setGeneratedCode] = useState("");

  const generateCode = async () => {
    const payload = {
      url,
      method,
      requestJson,
      responseJson,
      frameworkType: framework,
      languageType: language
    };

    const res = await axios.post("http://localhost:8080/api/generate", payload);
    setGeneratedCode(res.data.generatedCode);
  };

  const downloadZip = async () => {
    const payload = {
      url,
      method,
      requestJson,
      responseJson,
      frameworkType: framework,
      languageType: language
    };

    const res = await axios.post("http://localhost:8080/api/generate/zip", payload, {
      responseType: "blob"
    });

    const blob = new Blob([res.data], { type: "application/zip" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "generated-framework.zip";
    link.click();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Automation Framework Generator</h2>

      <div>
        <label>URL:</label>
        <input value={url} onChange={e => setUrl(e.target.value)} />
      </div>

      <div>
        <label>Method:</label>
        <select value={method} onChange={e => setMethod(e.target.value)}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
      </div>

      <div>
        <label>Request JSON:</label>
        <textarea rows="5" value={requestJson} onChange={e => setRequestJson(e.target.value)} />
      </div>

      <div>
        <label>Response JSON:</label>
        <textarea rows="5" value={responseJson} onChange={e => setResponseJson(e.target.value)} />
      </div>

      <div>
        <label>Framework:</label>
        <select value={framework} onChange={e => setFramework(e.target.value)}>
          <option value="SELENIUM">Selenium</option>
          <option value="CYPRESS">Cypress</option>
          <option value="PLAYWRIGHT">Playwright</option>
        </select>
      </div>

      <div>
        <label>Language:</label>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="JAVA">Java</option>
          <option value="TYPESCRIPT">TypeScript</option>
          <option value="JAVASCRIPT">JavaScript</option>
          <option value="PYTHON">Python</option>
          <option value="CSHARP">C#</option>
        </select>
      </div>

      <button onClick={generateCode}>Generate Code</button>
      <button onClick={downloadZip}>Download ZIP</button>

      <h3>Generated Code:</h3>
      <pre>{generatedCode}</pre>
    </div>
  );
}
