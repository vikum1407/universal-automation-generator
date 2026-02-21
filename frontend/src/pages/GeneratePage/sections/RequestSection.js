import Section from "../Section";

export default function RequestSection({
  requestJson,
  expectedResponseJson,
  expectedStatus,
  setExpectedStatus,
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
      title="Request & Expected Response"
      id="request"
      openSection={openSection}
      toggle={toggle}
      colors={colors}
    >
      <label style={labelStyle}>Request JSON:</label>
      <textarea
        style={inputStyle(errors.requestJson)}
        rows="5"
        value={requestJson}
        onChange={(e) => handleJsonChange("requestJson", e.target.value)}
      />
      {errors.requestJson && (
        <div style={errorTextStyle}>{errors.requestJson}</div>
      )}

      <label style={labelStyle}>Expected Response JSON:</label>
      <textarea
        style={inputStyle(errors.expectedResponseJson)}
        rows="5"
        value={expectedResponseJson}
        onChange={(e) =>
          handleJsonChange("expectedResponseJson", e.target.value)
        }
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
  );
}
