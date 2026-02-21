import React, { useState, useEffect } from "react";
import ConfigTable from "./ConfigTable";
import ConfigActions from "./ConfigActions";

export default function ConfigManagerPage({ colors, onLoadConfig }) {
  const [configs, setConfigs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedConfigs") || "[]");
    setConfigs(saved);
  }, []);

  const updateStorage = (updated) => {
    setConfigs(updated);
    localStorage.setItem("savedConfigs", JSON.stringify(updated));
  };

  const deleteConfig = (name) => {
    const updated = configs.filter((c) => c.name !== name);
    updateStorage(updated);
  };

  const renameConfig = (oldName, newName) => {
    const updated = configs.map((c) =>
      c.name === oldName ? { ...c, name: newName } : c
    );
    updateStorage(updated);
  };

  const duplicateConfig = (name) => {
    const cfg = configs.find((c) => c.name === name);
    if (!cfg) return;

    const newName = `${name}_copy`;
    const newCfg = { ...cfg, name: newName };

    updateStorage([...configs, newCfg]);
  };

  const exportConfig = (name) => {
    const cfg = configs.find((c) => c.name === name);
    if (!cfg) return;

    const blob = new Blob([JSON.stringify(cfg, null, 2)], {
      type: "application/json"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${name}.json`;
    link.click();
  };

  const importConfig = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        updateStorage([...configs, imported]);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const filtered = configs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px", color: colors.text }}>
      <h2 style={{ marginBottom: "20px" }}>Configuration Manager</h2>

      <ConfigActions
        search={search}
        setSearch={setSearch}
        importConfig={importConfig}
        colors={colors}
      />

      <ConfigTable
        configs={filtered}
        colors={colors}
        onLoadConfig={onLoadConfig}
        deleteConfig={deleteConfig}
        renameConfig={renameConfig}
        duplicateConfig={duplicateConfig}
        exportConfig={exportConfig}
      />
    </div>
  );
}
