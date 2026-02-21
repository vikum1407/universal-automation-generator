import React from "react";
import useGenerateForm from "../../hooks/useGenerateForm";

import ApiDetailsSection from "./sections/ApiDetailsSection";
import AuthSection from "./sections/AuthSection";
import HeadersSection from "./sections/HeadersSection";
import RequestSection from "./sections/RequestSection";
import FrameworkSection from "./sections/FrameworkSection";
import SavedConfigsSection from "./sections/SavedConfigsSection";
import Spinner from "./Spinner";

export default function GeneratePage({ theme, colors }) {
  const { state, actions } = useGenerateForm(colors);

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
      <h2 style={{ marginBottom: "20px", fontSize: "26px", color: colors.text }}>
        Automation Framework Generator
      </h2>

      <ApiDetailsSection
        url={state.url}
        setUrl={actions.setUrl}
        method={state.method}
        setMethod={actions.setMethod}
        environment={state.environment}
        setEnvironment={actions.setEnvironment}
        colors={colors}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        openSection={state.openSection}
        toggle={actions.toggle}
      />

      <AuthSection
        authType={state.authType}
        setAuthType={actions.setAuthType}
        apiKeyName={state.apiKeyName}
        setApiKeyName={actions.setApiKeyName}
        apiKeyValue={state.apiKeyValue}
        setApiKeyValue={actions.setApiKeyValue}
        apiKeyQueryName={state.apiKeyQueryName}
        setApiKeyQueryName={actions.setApiKeyQueryName}
        apiKeyQueryValue={state.apiKeyQueryValue}
        setApiKeyQueryValue={actions.setApiKeyQueryValue}
        basicUsername={state.basicUsername}
        setBasicUsername={actions.setBasicUsername}
        basicPassword={state.basicPassword}
        setBasicPassword={actions.setBasicPassword}
        customHeaderName={state.customHeaderName}
        setCustomHeaderName={actions.setCustomHeaderName}
        customHeaderValue={state.customHeaderValue}
        setCustomHeaderValue={actions.setCustomHeaderValue}
        colors={colors}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        openSection={state.openSection}
        toggle={actions.toggle}
      />

      <HeadersSection
        headers={state.headers}
        queryParams={state.queryParams}
        errors={state.errors}
        handleJsonChange={actions.handleJsonChange}
        colors={colors}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        errorTextStyle={errorTextStyle}
        openSection={state.openSection}
        toggle={actions.toggle}
      />

      <RequestSection
        requestJson={state.requestJson}
        expectedResponseJson={state.expectedResponseJson}
        expectedStatus={state.expectedStatus}
        setExpectedStatus={actions.setExpectedStatus}
        errors={state.errors}
        handleJsonChange={actions.handleJsonChange}
        colors={colors}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        errorTextStyle={errorTextStyle}
        openSection={state.openSection}
        toggle={actions.toggle}
      />

      <FrameworkSection
        testName={state.testName}
        setTestName={actions.setTestName}
        framework={state.framework}
        setFramework={actions.setFramework}
        language={state.language}
        setLanguage={actions.setLanguage}
        languageOptions={
          state.framework === "CYPRESS" || state.framework === "PLAYWRIGHT"
            ? ["JAVASCRIPT", "TYPESCRIPT"]
            : []
        }
        errors={state.errors}
        setErrors={actions.setErrors}
        colors={colors}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        errorTextStyle={errorTextStyle}
        openSection={state.openSection}
        toggle={actions.toggle}
      />

      <SavedConfigsSection
        configName={state.config.configName}
        setConfigName={actions.setConfigName}
        selectedConfig={state.config.selectedConfig}
        setSelectedConfig={actions.setSelectedConfig}
        savedConfigs={state.config.savedConfigs}
        saveConfig={actions.saveConfig}
        loadConfig={actions.loadConfig}
        deleteConfig={actions.deleteConfig}
        renameConfig={actions.renameConfig}
        duplicateConfig={actions.duplicateConfig}
        colors={colors}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        openSection={state.openSection}
        toggle={actions.toggle}
      />

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={actions.generateCode}
          disabled={state.loadingGenerate || state.hasErrors}
          style={{
            padding: "10px 16px",
            background:
              state.loadingGenerate || state.hasErrors
                ? colors.buttonDisabled
                : colors.buttonBg,
            color: colors.buttonText,
            border: "none",
            borderRadius: "6px",
            cursor:
              state.loadingGenerate || state.hasErrors
                ? "not-allowed"
                : "pointer",
            display: "flex",
            alignItems: "center"
          }}
        >
          {state.loadingGenerate && <Spinner />}
          {state.loadingGenerate ? "Generating..." : "Generate Code"}
        </button>

        <button
          onClick={actions.downloadZip}
          disabled={state.loadingZip || state.hasErrors}
          style={{
            padding: "10px 16px",
            background:
              state.loadingZip || state.hasErrors
                ? colors.buttonDisabled
                : colors.buttonBg,
            color: colors.buttonText,
            border: "none",
            borderRadius: "6px",
            cursor:
              state.loadingZip || state.hasErrors
                ? "not-allowed"
                : "pointer",
            display: "flex",
            alignItems: "center"
          }}
        >
          {state.loadingZip && <Spinner />}
          {state.loadingZip ? "Downloading..." : "Download ZIP"}
        </button>

        <button
          onClick={actions.resetForm}
          style={{
            padding: "10px 16px",
            background: colors.buttonBg,
            color: colors.buttonText,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Reset Form
        </button>
      </div>

      <h3 style={{ marginTop: "30px", color: colors.text }}>Generated Code</h3>
      <pre
        style={{
          background: "#1e1e1e",
          padding: "16px",
          borderRadius: "6px",
          color: "#fff",
          whiteSpace: "pre-wrap"
        }}
      >
        {state.generatedCode}
      </pre>
    </div>
  );
}
