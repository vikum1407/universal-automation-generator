import React from "react";

export default function ConfigActions({ search, setSearch, importConfig, colors }) {
  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
      <input
        placeholder="Search configurations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "8px",
          borderRadius: "6px",
          border: `1px solid ${colors.border}`,
          background: colors.inputBg,
          color: colors.text,
          flex: 1
        }}
      />

      <label
        style={{
          padding: "8px 14px",
          background: colors.buttonBg,
          color: colors.buttonText,
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Import JSON
        <input
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={(e) => importConfig(e.target.files[0])}
        />
      </label>
    </div>
  );
}
