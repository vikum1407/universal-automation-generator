import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../ToastContext";
import { useSearchParams } from "react-router-dom";

export default function useGenerateForm(colors) {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // -----------------------------
  // STATE (flat)
  // -----------------------------
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

  // -----------------------------
  // STATE (grouped config)
  // -----------------------------
  const [configName, setConfigName] = useState("");
  const [savedConfigs, setSavedConfigs] = useState(
    JSON.parse(localStorage.getItem("savedConfigs") || "[]")
  );
  const [selectedConfig, setSelectedConfig] = useState("");

  // -----------------------------
  // HELPERS
  // -----------------------------
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

  const safeParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const hasErrors = Object.values(errors).some((e) => e !== "");

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

  // -----------------------------
  // ACTIONS
  // -----------------------------
  const generateCode = async () => {
    if (!validateForm()) return;

    setLoadingGenerate(true);
    try {
      const res = await axios.post("http://localhost:8080/api/generate", buildPayload());
      setGeneratedCode(res.data.generatedCode || "");
      showToast("Code generated successfully!", "success");
    } catch {
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
    } catch {
      showToast("Backend error occurred while downloading ZIP", "error");
    }
    setLoadingZip(false);
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

    applyConfig(cfg.data);
    showToast("Configuration loaded", "success");
  };

  const applyConfig = (d) => {
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
  };

  const deleteConfig = (name) => {
    const updated = savedConfigs.filter((c) => c.name !== name);
    setSavedConfigs(updated);
    localStorage.setItem("savedConfigs", JSON.stringify(updated));
    showToast("Configuration deleted", "success");

    if (selectedConfig === name) {
      setSelectedConfig("");
    }
  };

  const renameConfig = (oldName, newName) => {
    if (!newName.trim()) {
      showToast("New name is required", "warning");
      return;
    }

    if (savedConfigs.some((c) => c.name === newName && c.name !== oldName)) {
      showToast("A configuration with this name already exists", "warning");
      return;
    }

    const updated = savedConfigs.map((c) =>
      c.name === oldName ? { ...c, name: newName } : c
    );

    setSavedConfigs(updated);
    localStorage.setItem("savedConfigs", JSON.stringify(updated));
    showToast("Configuration renamed", "success");

    if (selectedConfig === oldName) {
      setSelectedConfig(newName);
    }
  };

  // -----------------------------
  // DUPLICATE CONFIG
  // -----------------------------
  const duplicateConfig = (name) => {
    const cfg = savedConfigs.find((c) => c.name === name);
    if (!cfg) return;

    let base = `${name} (copy)`;
    let finalName = base;
    let counter = 2;

    while (savedConfigs.some((c) => c.name === finalName)) {
      finalName = `${base} ${counter}`;
      counter++;
    }

    const newConfig = {
      name: finalName,
      data: cfg.data
    };

    const updated = [...savedConfigs, newConfig];
    setSavedConfigs(updated);
    localStorage.setItem("savedConfigs", JSON.stringify(updated));

    showToast("Configuration duplicated", "success");
  };

  // -----------------------------
  // RESET FORM
  // -----------------------------
  const resetForm = () => {
    setUrl("");
    setMethod("GET");
    setHeaders("{}");
    setQueryParams("{}");
    setRequestJson("{}");
    setExpectedResponseJson("{}");
    setExpectedStatus(200);
    setTestName("");
    setFramework("");
    setLanguage("");
    setEnvironment("dev");

    setAuthType("NONE");
    setApiKeyName("");
    setApiKeyValue("");
    setApiKeyQueryName("");
    setApiKeyQueryValue("");
    setBasicUsername("");
    setBasicPassword("");
    setCustomHeaderName("");
    setCustomHeaderValue("");

    setErrors({
      headers: "",
      queryParams: "",
      requestJson: "",
      expectedResponseJson: "",
      testName: "",
      framework: "",
      language: ""
    });

    setOpenSection(null);
    showToast("Form reset", "success");
  };

  // -----------------------------
  // URL-BASED CONFIG LOADING
  // -----------------------------
  useEffect(() => {
    const loadName = searchParams.get("load");
    if (!loadName) return;

    const cfg = savedConfigs.find((c) => c.name === loadName);
    if (!cfg) return;

    applyConfig(cfg.data);
    showToast(`Loaded config: ${loadName}`, "success");
  }, [searchParams]);

  // -----------------------------
  // RETURN (Option B1)
  // -----------------------------
  return {
    state: {
      url,
      method,
      headers,
      queryParams,
      requestJson,
      expectedStatus,
      expectedResponseJson,
      framework,
      language,
      testName,
      environment,
      authType,
      apiKeyName,
      apiKeyValue,
      apiKeyQueryName,
      apiKeyQueryValue,
      basicUsername,
      basicPassword,
      customHeaderName,
      customHeaderValue,
      openSection,
      loadingGenerate,
      loadingZip,
      errors,
      generatedCode,

      config: {
        configName,
        savedConfigs,
        selectedConfig
      }
    },

    actions: {
      setUrl,
      setMethod,
      setHeaders,
      setQueryParams,
      setRequestJson,
      setExpectedStatus,
      setExpectedResponseJson,
      setFramework,
      setLanguage,
      setTestName,
      setEnvironment,
      setAuthType,
      setApiKeyName,
      setApiKeyValue,
      setApiKeyQueryName,
      setApiKeyQueryValue,
      setBasicUsername,
      setBasicPassword,
      setCustomHeaderName,
      setCustomHeaderValue,
      setOpenSection,
      setConfigName,
      setSelectedConfig,
      setErrors,          // ← add this line

      toggle,
      handleJsonChange,
      generateCode,
      downloadZip,
      saveConfig,
      loadConfig,
      deleteConfig,
      renameConfig,
      duplicateConfig,
      resetForm
    }    
  };
}
