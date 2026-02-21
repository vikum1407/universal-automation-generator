import Section from "../Section";

export default function FrameworkSection({
  testName,
  setTestName,
  framework,
  setFramework,
  language,
  setLanguage,
  languageOptions,
  errors,
  setErrors,
  colors,
  inputStyle,
  labelStyle,
  errorTextStyle,
  openSection,
  toggle
}) {
  return (
    <Section
      title="Framework & Language"
      id="framework"
      openSection={openSection}
      toggle={toggle}
      colors={colors}
    >
      <label style={labelStyle}>Test Name:</label>
      <input
        style={inputStyle(errors.testName)}
        value={testName}
        onChange={(e) => {
          setTestName(e.target.value);
          setErrors((prev) => ({ ...prev, testName: "" }));
        }}
      />
      {errors.testName && (
        <div style={errorTextStyle}>{errors.testName}</div>
      )}

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
      {errors.framework && (
        <div style={errorTextStyle}>{errors.framework}</div>
      )}

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
      {errors.language && (
        <div style={errorTextStyle}>{errors.language}</div>
      )}
    </Section>
  );
}
