import Section from "../Section";

export default function HeadersSection({
  headers,
  queryParams,
  errors,
  handleJsonChange,
  colors,
  inputStyle,
  labelStyle,
  errorTextStyle,
  openSection,
  toggle
}) {
  return (
    <Section
      title="Headers & Query Params"
      id="headers"
      openSection={openSection}
      toggle={toggle}
      colors={colors}
    >
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
      {errors.queryParams && (
        <div style={errorTextStyle}>{errors.queryParams}</div>
      )}
    </Section>
  );
}
