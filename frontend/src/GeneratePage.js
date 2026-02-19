import React, { useState } from "react";
import axios from "axios";

export default function GeneratePage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [requestJson, setRequestJson] = useState("{}");
  const [responseJson, setResponseJson] = useState("{}");

  const [headers, setHeaders] = useState("{}");
  const [queryParams, setQueryParams] = useState("{}");
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [expectedResponseJson, setExpectedResponseJson] = useState("{}");

  const [framework, setFramework] = useState("SELENIUM");
  const [language, setLanguage] = useState("JAVA");
  const [generatedCode, setGeneratedCode] = useState("");

  const [testName, setTestName] = useState("");
  const [environment, setEnvironment] = useState("dev");

  // ⭐ Authentication fields
  const [authType, setAuthType] = useState("NONE");

  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");

  const [apiKeyQueryName, setApiKeyQueryName] = useState("");
  const [apiKeyQueryValue, setApiKeyQueryValue] = useState("");

  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");

  const [customHeaderName, setCustomHeaderName] = useState("");
  const [customHeaderValue, setCustomHeaderValue] = useState("");

  const safeParse = (value) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      return {};
    }
  };

  const buildPayload = () => ({
    url,
    method,
    headers: safeParse(headers),
    queryParams: safeParse(queryParams),
    requestJson,
    responseJson,
    expectedStatus,
    expectedResponseJson,
    testName,
    frameworkType: framework,
    languageType: language,
    environment,

    // ⭐ Authentication fields
    authType,
    apiKeyName,
    apiKeyValue,
    apiKeyQueryName,
    apiKeyQueryValue,
    basicUsername,
    basicPassword,
    customHeaderName,
    customHeaderValue
  });

  const generateCode = async () => {
    const res = await axios.post("http://localhost:8080/api/generate", buildPayload());
    setGeneratedCode(res.data.generatedCode);
  };

  const downloadZip = async () => {
    const res = await axios.post("http://localhost:8080/api/generate/zip", buildPayload(), {
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
          <option>PATCH</option>
          <option>OPTIONS</option>
          <option>HEAD</option>
        </select>
      </div>

      <div>
        <label>Environment:</label>
        <select value={environment} onChange={e => setEnvironment(e.target.value)}>
          <option value="dev">dev</option>
          <option value="qa">qa</option>
          <option value="prod">prod</option>
        </select>
      </div>

      {/* ⭐ AUTH TYPE DROPDOWN */}
      <div>
        <label>Auth Type:</label>
        <select value={authType} onChange={e => setAuthType(e.target.value)}>
          <option value="NONE">None</option>
          <option value="BEARER">Bearer Token (from config)</option>
          <option value="API_KEY_HEADER">API Key (Header)</option>
          <option value="API_KEY_QUERY">API Key (Query Param)</option>
          <option value="BASIC">Basic Auth</option>
          <option value="CUSTOM_HEADER">Custom Header</option>
        </select>
      </div>

      {/* ⭐ CONDITIONAL AUTH FIELDS */}

      {authType === "API_KEY_HEADER" && (
        <>
          <input placeholder="API Key Name" value={apiKeyName} onChange={e => setApiKeyName(e.target.value)} />
          <input placeholder="API Key Value" value={apiKeyValue} onChange={e => setApiKeyValue(e.target.value)} />
        </>
      )}

      {authType === "API_KEY_QUERY" && (
        <>
          <input placeholder="Query Param Name" value={apiKeyQueryName} onChange={e => setApiKeyQueryName(e.target.value)} />
          <input placeholder="Query Param Value" value={apiKeyQueryValue} onChange={e => setApiKeyQueryValue(e.target.value)} />
        </>
      )}

      {authType === "BASIC" && (
        <>
          <input placeholder="Username" value={basicUsername} onChange={e => setBasicUsername(e.target.value)} />
          <input placeholder="Password" value={basicPassword} onChange={e => setBasicPassword(e.target.value)} />
        </>
      )}

      {authType === "CUSTOM_HEADER" && (
        <>
          <input placeholder="Header Name" value={customHeaderName} onChange={e => setCustomHeaderName(e.target.value)} />
          <input placeholder="Header Value" value={customHeaderValue} onChange={e => setCustomHeaderValue(e.target.value)} />
        </>
      )}

      <div>
        <label>Headers (JSON):</label>
        <textarea
          rows="3"
          placeholder='{"Content-Type": "application/json"}'
          value={headers}
          onChange={e => setHeaders(e.target.value)}
        />
      </div>

      <div>
        <label>Query Params (JSON):</label>
        <textarea
          rows="3"
          placeholder='{"page": "1"}'
          value={queryParams}
          onChange={e => setQueryParams(e.target.value)}
        />
      </div>

      <div>
        <label>Request JSON:</label>
        <textarea rows="5" value={requestJson} onChange={e => setRequestJson(e.target.value)} />
      </div>

      <div>
        <label>Expected Response JSON:</label>
        <textarea rows="5" value={expectedResponseJson} onChange={e => setExpectedResponseJson(e.target.value)} />
      </div>

      <div>
        <label>Expected Status:</label>
        <input
          type="number"
          value={expectedStatus}
          onChange={e => setExpectedStatus(parseInt(e.target.value))}
        />
      </div>

      <div>
        <label>Test Name:</label>
        <input
          placeholder="Example: CreatePostTest"
          value={testName}
          onChange={e => setTestName(e.target.value)}
        />
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
        </select>
      </div>

      <button onClick={generateCode}>Generate Code</button>
      <button onClick={downloadZip}>Download ZIP</button>

      <h3>Generated Code:</h3>
      <pre>{generatedCode}</pre>
    </div>
  );
}
