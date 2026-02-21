import React, { useState } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useToast } from "./ToastContext";

export default function GeneratePage({ theme, colors }) {
  const { showToast } = useToast();

  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [requestJson, setRequestJson] = useState("{}");
  const [responseJson] = useState("{}");

  const [headers, setHeaders] = useState("{}");
  const [queryParams, setQueryParams] = useState("{}");
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [expectedResponseJson, setExpectedResponseJson] = useState("{}");

  const [framework, setFramework] = useState("");
  const [language, setLanguage] = useState("");

  const [generatedCode, setGeneratedCode] = useState("");

  const [testName, setTestName] = useState("");
  const [environment, setEnvironment] = useState("dev");

  const [authType, setAuthType] = useState("NONE");

  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");

  const [apiKeyQueryName, setApiKeyQueryName] = useState("");
  const [apiKeyQueryValue, setApiKeyQueryValue] = useState("");

  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");

  const [customHeaderName, setCustomHeaderName] = useState("");
  const [customHeaderValue, setCustomHeaderValue] = useState("");

  const [openSection, setOpenSection] = useState(null);

  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);

  const [errors, setErrors] = useState({
    headers: "",
    queryParams: "",
    requestJson: "",
    expectedResponseJson: "",
    testName: "",
    framework: "",
    language: ""
  });

  const [configName, setConfigName] = useState("");
  const [savedConfigs, setSavedConfigs] = useState(
  JSON.parse(localStorage.getItem("savedConfigs") || "[]")
  );
  const [selectedConfig, setSelectedConfig] = useState("");


  const toggle = (section) =>
    setOpenSection(openSection === section ? null : section);

  const validateJson = (value) => {
    try {
      JSON.parse(value);
      return "";
    } catch {
      return "Invalid JSON format";
    }
  };

  const handleJsonChange = (field, value) => {
    const error = validateJson(value);
    setErrors((prev) => ({ ...prev, [field]: error }));

    if (field === "headers") setHeaders(value);
    if (field === "queryParams") setQueryParams(value);
    if (field === "requestJson") setRequestJson(value);
    if (field === "expectedResponseJson") setExpectedResponseJson(value);
  };

  const saveConfig = () => {
  if (!configName.trim()) {
    showToast("Configuration name is required", "warning");
    return;
  }

  const newConfig = {
    name: configName,
    data: buildPayload()
  };

  const updated = [...savedConfigs, newConfig];
  setSavedConfigs(updated);
  localStorage.setItem("savedConfigs", JSON.stringify(updated));

  showToast("Configuration saved", "success");
  setConfigName("");
  };

  const loadConfig = () => {
    if (!selectedConfig) {
      showToast("Select a configuration to load", "warning");
      return;
    }

    const cfg = savedConfigs.find((c) => c.name === selectedConfig);
    if (!cfg) return;

    const d = cfg.data;

    setUrl(d.url);
    setMethod(d.method);
    setHeaders(JSON.stringify(d.headers, null, 2));
    setQueryParams(JSON.stringify(d.queryParams, null, 2));
    setRequestJson(d.requestJson);
    setExpectedResponseJson(d.expectedResponseJson);
    setExpectedStatus(d.expectedStatus);
    setTestName(d.testName);
    setFramework(d.frameworkType);
    setLanguage(d.languageType);
    setEnvironment(d.environment);

    setAuthType(d.authType);
    setApiKeyName(d.apiKeyName);
    setApiKeyValue(d.apiKeyValue);
    setApiKeyQueryName(d.apiKeyQueryName);
    setApiKeyQueryValue(d.apiKeyQueryValue);
    setBasicUsername(d.basicUsername);
    setBasicPassword(d.basicPassword);
    setCustomHeaderName(d.customHeaderName);
    setCustomHeaderValue(d.customHeaderValue);

    showToast("Configuration loaded", "success");
  };

  const hasErrors = Object.values(errors).some((e) => e !== "");

  const safeParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const languageOptions =
    framework === "CYPRESS" || framework === "PLAYWRIGHT"
      ? ["JAVASCRIPT", "TYPESCRIPT"]
      : [];

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

  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    if (!url.trim()) {
      valid = false;
      showToast("API URL is required", "warning");
    }

    if (!testName.trim()) {
      valid = false;
      newErrors.testName = "Test name is required";
    }

    if (!framework.trim()) {
      valid = false;
      newErrors.framework = "Framework is required";
    }

    if (!language.trim()) {
      valid = false;
      newErrors.language = "Language is required";
    }

    if (hasErrors) {
      valid = false;
      showToast("Please fix JSON validation errors", "warning");
    }

    setErrors(newErrors);
    return valid;
  };

  const generateCode = async () => {
    if (!validateForm()) return;

    setLoadingGenerate(true);
    try {
      const res = await axios.post("http://localhost:8080/api/generate", buildPayload());
      setGeneratedCode(res.data.generatedCode || "");
      showToast("Code generated successfully!", "success");
    } catch (e) {
      showToast("Backend error occurred while generating code", "error");
    }
    setLoadingGenerate(false);
  };

  const downloadZip = async () => {
    if (!validateForm()) return;

    setLoadingZip(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/api/generate/zip",
        buildPayload(),
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/zip" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "generated-framework.zip";
      link.click();

      showToast("ZIP downloaded!", "success");
    } catch (e) {
      showToast("Backend error occurred while downloading ZIP", "error");
    }
    setLoadingZip(false);
  };

  const Spinner = () => (
    <div
      style={{
        width: "16px",
        height: "16px",
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
        marginRight: "8px"
      }}
    />
  );

  const Section = ({ title, id, children }) => (
    <div
      style={{
        marginBottom: "20px",
        borderRadius: "8px",
        border: `1px solid ${colors.border}`,
        background: colors.card,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }}
    >
      <div
        onClick={() => toggle(id)}
        style={{
          padding: "14px 18px",
          background: colors.header,
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "15px",
          color: colors.text,
          borderBottom: openSection === id ? `1px solid ${colors.border}` : "none"
        }}
      >
        {title}
      </div>

      {openSection === id && (
        <div style={{ padding: "18px", background: colors.card, color: colors.text }}>
          {children}
        </div>
      )}
    </div>
  );

  const inputStyle = (error) => ({
    marginBottom: "10px",
    padding: "8px",
    width: "100%",
    borderRadius: "6px",
    border: `1px solid ${error ? colors.inputError : colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.text
  });

  const labelStyle = {
    fontWeight: "600",
    marginTop: "10px",
    marginBottom: "4px",
    display: "block",
    color: colors.text
  };

  const errorTextStyle = {
    color: colors.errorText,
    fontSize: "13px",
    marginBottom: "8px"
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
        background: colors.bg,
        minHeight: "100%",
        transition: "0.3s"
      }}
    >
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <h2 style={{ marginBottom: "20px", fontSize: "26px", color: colors.text }}>
        Automation Framework Generator
      </h2>

      <Section title="API Details" id="api">
        <label style={labelStyle}>URL:</label>
        <input
          style={inputStyle()}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <label style={labelStyle}>Method:</label>
        <select
          style={inputStyle()}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
          <option>PATCH</option>
          <option>OPTIONS</option>
          <option>HEAD</option>
        </select>

        <label style={labelStyle}>Environment:</label>
        <select
          style={inputStyle()}
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
        >
          <option value="dev">dev</option>
          <option value="qa">qa</option>
          <option value="prod">prod</option>
        </select>
      </Section>

      <Section title="Authentication" id="auth">
        <label style={labelStyle}>Auth Type:</label>
        <select
          style={inputStyle()}
          value={authType}
          onChange={(e) => setAuthType(e.target.value)}
        >
          <option value="NONE">None</option>
          <option value="BEARER">Bearer Token</option>
          <option value="API_KEY_HEADER">API Key (Header)</option>
          <option value="API_KEY_QUERY">API Key (Query)</option>
          <option value="BASIC">Basic Auth</option>
          <option value="CUSTOM_HEADER">Custom Header</option>
        </select>

        {authType === "API_KEY_HEADER" && (
          <>
            <input
              style={inputStyle()}
              placeholder="API Key Name"
              value={apiKeyName}
              onChange={(e) => setApiKeyName(e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="API Key Value"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
            />
          </>
        )}

        {authType === "API_KEY_QUERY" && (
          <>
            <input
              style={inputStyle()}
              placeholder="Query Param Name"
              value={apiKeyQueryName}
              onChange={(e) => setApiKeyQueryName(e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="Query Param Value"
              value={apiKeyQueryValue}
              onChange={(e) => setApiKeyQueryValue(e.target.value)}
            />
          </>
        )}

        {authType === "BASIC" && (
          <>
            <input
              style={inputStyle()}
              placeholder="Username"
              value={basicUsername}
              onChange={(e) => setBasicUsername(e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="Password"
              value={basicPassword}
              onChange={(e) => setBasicPassword(e.target.value)}
            />
          </>
        )}

        {authType === "CUSTOM_HEADER" && (
          <>
            <input
              style={inputStyle()}
              placeholder="Header Name"
              value={customHeaderName}
              onChange={(e) => setCustomHeaderName(e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="Header Value"
              value={customHeaderValue}
              onChange={(e) => setCustomHeaderValue(e.target.value)}
            />
          </>
        )}
      </Section>

      <Section title="Headers & Query Params" id="headers">
        <label style={labelStyle}>Headers (JSON):</label>
        <textarea
          style={inputStyle(errors.headers)}
          rows="3"
          value={headers}
          onChange={(e) => handleJsonChange("headers", e.target.value)}
        />
        {errors.headers && <div style={errorTextStyle}>{errors.headers}</div>}

        <label style={labelStyle}>Query Params (JSON):</label>
        <textarea
          style={inputStyle(errors.queryParams)}
          rows="3"
          value={queryParams}
          onChange={(e) => handleJsonChange("queryParams", e.target.value)}
        />
        {errors.queryParams && <div style={errorTextStyle}>{errors.queryParams}</div>}
      </Section>

      <Section title="Request & Expected Response" id="request">
        <label style={labelStyle}>Request JSON:</label>
        <textarea
          style={inputStyle(errors.requestJson)}
          rows="5"
          value={requestJson}
          onChange={(e) => handleJsonChange("requestJson", e.target.value)}
        />
        {errors.requestJson && <div style={errorTextStyle}>{errors.requestJson}</div>}

        <label style={labelStyle}>Expected Response JSON:</label>
        <textarea
          style={inputStyle(errors.expectedResponseJson)}
          rows="5"
          value={expectedResponseJson}
          onChange={(e) => handleJsonChange("expectedResponseJson", e.target.value)}
        />
        {errors.expectedResponseJson && (
          <div style={errorTextStyle}>{errors.expectedResponseJson}</div>
        )}

        <label style={labelStyle}>Expected Status:</label>
        <input
          style={inputStyle()}
          type="number"
          value={expectedStatus}
          onChange={(e) => setExpectedStatus(parseInt(e.target.value))}
        />
      </Section>

      <Section title="Framework & Language" id="framework">
        <label style={labelStyle}>Test Name:</label>
        <input
          style={inputStyle(errors.testName)}
          value={testName}
          onChange={(e) => {
            setTestName(e.target.value);
            setErrors((prev) => ({ ...prev, testName: "" }));
          }}
        />
        {errors.testName && <div style={errorTextStyle}>{errors.testName}</div>}

        <label style={labelStyle}>Framework:</label>
        <select
          style={inputStyle(errors.framework)}
          value={framework}
          onChange={(e) => {
            setFramework(e.target.value);
            setLanguage("");
            setErrors((prev) => ({ ...prev, framework: "" }));
          }}
        >
          <option value="">Select Framework</option>
          <option value="CYPRESS">Cypress</option>
          <option value="PLAYWRIGHT">Playwright</option>
        </select>
        {errors.framework && <div style={errorTextStyle}>{errors.framework}</div>}

        <label style={labelStyle}>Language:</label>
        <select
          style={inputStyle(errors.language)}
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setErrors((prev) => ({ ...prev, language: "" }));
          }}
          disabled={languageOptions.length === 0}
        >
          <option value="">Select Language</option>
          {languageOptions.map((lang) => (
            <option key={lang} value={lang}>
              {lang === "JAVASCRIPT" ? "JavaScript" : "TypeScript"}
            </option>
          ))}
        </select>
        {errors.language && <div style={errorTextStyle}>{errors.language}</div>}
      </Section>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={generateCode}
          disabled={loadingGenerate || hasErrors}
          style={{
            padding: "10px 16px",
            background: loadingGenerate || hasErrors ? colors.buttonDisabled : colors.buttonBg,
            color: colors.buttonText,
            border: "none",
            borderRadius: "6px",
            cursor: loadingGenerate || hasErrors ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center"
          }}
        >
          {loadingGenerate && <Spinner />}
          {loadingGenerate ? "Generating..." : "Generate Code"}
        </button>

        <button
          onClick={downloadZip}
          disabled={loadingZip || hasErrors}
          style={{
            padding: "10px 16px",
            background: loadingZip || hasErrors ? colors.buttonDisabled : colors.buttonBg,
            color: colors.buttonText,
            border: "none",
            borderRadius: "6px",
            cursor: loadingZip || hasErrors ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center"
          }}
        >
          {loadingZip && <Spinner />}
          {loadingZip ? "Downloading..." : "Download ZIP"}
        </button>
      </div>

      <h3 style={{ marginTop: "30px", color: colors.text }}>Generated Code</h3>
      <SyntaxHighlighter language="javascript" style={oneDark}>
        {generatedCode}
      </SyntaxHighlighter>
    </div>
  );
}
