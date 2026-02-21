import Section from "../Section";

export default function AuthSection({
  authType,
  setAuthType,
  apiKeyName,
  setApiKeyName,
  apiKeyValue,
  setApiKeyValue,
  apiKeyQueryName,
  setApiKeyQueryName,
  apiKeyQueryValue,
  setApiKeyQueryValue,
  basicUsername,
  setBasicUsername,
  basicPassword,
  setBasicPassword,
  customHeaderName,
  setCustomHeaderName,
  customHeaderValue,
  setCustomHeaderValue,
  colors,
  inputStyle,
  labelStyle,
  openSection,
  toggle
}) {
  return (
    <Section
      title="Authentication"
      id="auth"
      openSection={openSection}
      toggle={toggle}
      colors={colors}
    >
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
  );
}
