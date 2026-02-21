import React, { useState } from "react";

export default function ConfigTable({
  configs,
  colors,
  onLoadConfig,
  deleteConfig,
  renameConfig,
  duplicateConfig,
  exportConfig
}) {
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (name) => {
    setRenameTarget(name);
    setRenameValue(name);
  };

  const confirmRename = () => {
    renameConfig(renameTarget, renameValue);
    setRenameTarget(null);
  };

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "20px"
      }}
    >
      <thead>
        <tr style={{ background: colors.header }}>
          <th style={{ padding: "10px", textAlign: "left" }}>Name</th>
          <th style={{ padding: "10px", textAlign: "left" }}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {configs.map((cfg) => (
          <tr
            key={cfg.name}
            style={{
              borderBottom: `1px solid ${colors.border}`
            }}
          >
            <td style={{ padding: "10px" }}>
              {renameTarget === cfg.name ? (
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text
                  }}
                />
              ) : (
                cfg.name
              )}
            </td>

            <td style={{ padding: "10px", display: "flex", gap: "8px" }}>
              {renameTarget === cfg.name ? (
                <>
                  <button
                    onClick={confirmRename}
                    style={{
                      padding: "6px 10px",
                      background: colors.buttonBg,
                      color: colors.buttonText,
                      border: "none",
                      borderRadius: "4px"
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setRenameTarget(null)}
                    style={{
                      padding: "6px 10px",
                      background: colors.inputBorder,
                      color: colors.text,
                      border: "none",
                      borderRadius: "4px"
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onLoadConfig(cfg.name)}
                    style={{
                      padding: "6px 10px",
                      background: colors.buttonBg,
                      color: colors.buttonText,
                      border: "none",
                      borderRadius: "4px"
                    }}
                  >
                    Load
                  </button>

                  <button
                    onClick={() => startRename(cfg.name)}
                    style={{
                      padding: "6px 10px",
                      background: colors.buttonBg,
                      color: colors.buttonText,
                      border: "none",
                      borderRadius: "4px"
                    }}
                  >
                    Rename
                  </button>

                  <button
                    onClick={() => duplicateConfig(cfg.name)}
                    style={{
                      padding: "6px 10px",
                      background: colors.buttonBg,
                      color: colors.buttonText,
                      border: "none",
                      borderRadius: "4px"
                    }}
                  >
                    Duplicate
                  </button>

                  <button
                    onClick={() => exportConfig(cfg.name)}
                    style={{
                      padding: "6px 10px",
                      background: colors.buttonBg,
                      color: colors.buttonText,
                      border: "none",
                      borderRadius: "4px"
                    }}
                  >
                    Export
                  </button>

                  <button
                    onClick={() => deleteConfig(cfg.name)}
                    style={{
                      padding: "6px 10px",
                      background: colors.errorText,
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px"
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
