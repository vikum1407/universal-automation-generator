import { useState } from "react";
import Section from "../Section";

export default function SavedConfigsSection({
  configName,
  setConfigName,
  selectedConfig,
  setSelectedConfig,
  savedConfigs,
  saveConfig,
  loadConfig,
  deleteConfig,
  renameConfig,
  duplicateConfig,
  colors,
  inputStyle,
  labelStyle,
  openSection,
  toggle
}) {
  const [renameMode, setRenameMode] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const startRename = () => {
    if (!selectedConfig) return;
    setRenameMode(true);
    setRenameValue(selectedConfig);
  };

  const confirmRename = () => {
    renameConfig(selectedConfig, renameValue);
    setRenameMode(false);
  };

  const cancelRename = () => {
    setRenameMode(false);
    setRenameValue("");
  };

  const handleDelete = () => {
    if (!selectedConfig) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete configuration "${selectedConfig}"?`
    );
    if (confirmed) {
      deleteConfig(selectedConfig);
    }
  };

  const handleDuplicate = () => {
    if (!selectedConfig) return;
    duplicateConfig(selectedConfig);
  };

  return (
    <Section
      title="Saved Configurations"
      id="saved"
      openSection={openSection}
      toggle={toggle}
      colors={colors}
    >
      {/* SAVE NEW CONFIG */}
      <label style={labelStyle}>Save as:</label>
      <input
        style={inputStyle()}
        placeholder="Configuration name"
        value={configName}
        onChange={(e) => setConfigName(e.target.value)}
      />

      <button
        onClick={saveConfig}
        style={{
          padding: "8px 14px",
          background: colors.buttonBg,
          color: colors.buttonText,
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginTop: "10px"
        }}
      >
        Save Configuration
      </button>

      <hr style={{ margin: "20px 0", borderColor: colors.border }} />

      {/* LOAD / MANAGE CONFIGS */}
      <label style={labelStyle}>Load Configuration:</label>
      <select
        style={inputStyle()}
        value={selectedConfig}
        onChange={(e) => setSelectedConfig(e.target.value)}
      >
        <option value="">Select saved config</option>
        {savedConfigs.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
        <button
          onClick={loadConfig}
          style={{
            padding: "8px 14px",
            background: colors.buttonBg,
            color: colors.buttonText,
            border: "none",
            borderRadius: "6px",
            cursor: selectedConfig ? "pointer" : "not-allowed",
            opacity: selectedConfig ? 1 : 0.6
          }}
          disabled={!selectedConfig}
        >
          Load
        </button>

        <button
          onClick={startRename}
          style={{
            padding: "8px 14px",
            background: colors.buttonBg,
            color: colors.buttonText,
            border: "none",
            borderRadius: "6px",
            cursor: selectedConfig ? "pointer" : "not-allowed",
            opacity: selectedConfig ? 1 : 0.6
          }}
          disabled={!selectedConfig}
        >
          Rename
        </button>

        <button
          onClick={handleDuplicate}
          style={{
            padding: "8px 14px",
            background: colors.buttonBg,
            color: colors.buttonText,
            border: "none",
            borderRadius: "6px",
            cursor: selectedConfig ? "pointer" : "not-allowed",
            opacity: selectedConfig ? 1 : 0.6
          }}
          disabled={!selectedConfig}
        >
          Duplicate
        </button>

        <button
          onClick={handleDelete}
          style={{
            padding: "8px 14px",
            background: colors.errorText,
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: selectedConfig ? "pointer" : "not-allowed",
            opacity: selectedConfig ? 1 : 0.6
          }}
          disabled={!selectedConfig}
        >
          Delete
        </button>
      </div>

      {/* RENAME UI */}
      {renameMode && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            borderRadius: "6px",
            border: `1px solid ${colors.border}`,
            background: colors.card
          }}
        >
          <label style={labelStyle}>New name:</label>
          <input
            style={inputStyle()}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />

          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button
              onClick={confirmRename}
              style={{
                padding: "6px 12px",
                background: colors.buttonBg,
                color: colors.buttonText,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Confirm
            </button>

            <button
              onClick={cancelRename}
              style={{
                padding: "6px 12px",
                background: colors.inputBorder,
                color: colors.text,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}
