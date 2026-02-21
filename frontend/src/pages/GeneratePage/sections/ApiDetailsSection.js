import Section from "../Section";

export default function ApiDetailsSection({
  url,
  setUrl,
  method,
  setMethod,
  environment,
  setEnvironment,
  colors,
  inputStyle,
  labelStyle,
  openSection,
  toggle
}) {
  return (
    <Section
      title="API Details"
      id="api"
      openSection={openSection}
      toggle={toggle}
      colors={colors}
    >
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
  );
}
