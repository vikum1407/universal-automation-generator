import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";

import GeneratePage from "./pages/GeneratePage/GeneratePage";
import TemplatesPage from "./TemplatesPage";
import HistoryPage from "./HistoryPage";
import SettingsPage from "./SettingsPage";
import ConfigManagerPage from "./pages/ConfigManager/ConfigManagerPage";

import TopBar from "./TopBar";
import { ToastProvider } from "./ToastContext";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [collapsed, setCollapsed] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const colors =
    theme === "light"
      ? {
          bg: "#f5f5f5",
          card: "#ffffff",
          border: "#ddd",
          text: "#222",
          header: "#eaeaea",
          buttonBg: "#007bff",
          buttonText: "#fff",
          inputBg: "#fff",
          inputBorder: "#ccc",
          inputError: "#ff4d4d",
          errorText: "#d9534f"
        }
      : {
          bg: "#1e1e1e",
          card: "#2a2a2a",
          border: "#444",
          text: "#eee",
          header: "#333",
          buttonBg: "#0d6efd",
          buttonText: "#fff",
          inputBg: "#2a2a2a",
          inputBorder: "#555",
          inputError: "#ff4d4d",
          errorText: "#ff6b6b"
        };

  return (
    <ToastProvider>
      <BrowserRouter>
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <TopBar theme={theme} toggleTheme={toggleTheme} colors={colors} />

            <div style={{ flex: 1, overflowY: "auto" }}>
              <Routes>
                <Route
                  path="/"
                  element={<GeneratePage theme={theme} colors={colors} />}
                />

                <Route
                  path="/config-manager"
                  element={<ConfigManagerWrapper colors={colors} />}
                />

                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

function ConfigManagerWrapper({ colors }) {
  const navigate = useNavigate();

  return (
    <ConfigManagerPage
      colors={colors}
      onLoadConfig={(name) => {
        navigate(`/?load=${name}`);
      }}
    />
  );
}

function Sidebar({ collapsed, toggleSidebar }) {
  const width = collapsed ? "60px" : "220px";

  const sidebarStyle = {
    width,
    background: "#111",
    color: "#fff",
    padding: "20px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    transition: "0.25s width ease"
  };

  const itemStyle = {
    padding: "10px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    opacity: 0.9,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textDecoration: "none",
    color: "#fff"
  };

  const itemHover = {
    background: "#222",
    opacity: 1
  };

  const iconOnly = collapsed ? { justifyContent: "center" } : {};

  return (
    <div style={sidebarStyle}>
      <div
        onClick={toggleSidebar}
        style={{
          padding: "8px",
          background: "#222",
          borderRadius: "6px",
          cursor: "pointer",
          textAlign: "center",
          fontSize: "14px"
        }}
      >
        {collapsed ? "»" : "«"}
      </div>

      <Link
        to="/"
        style={{ ...itemStyle, ...iconOnly }}
        onMouseEnter={(e) => Object.assign(e.target.style, itemHover)}
        onMouseLeave={(e) => Object.assign(e.target.style, itemStyle)}
      >
        🧪 {!collapsed && "Generate Tests"}
      </Link>

      <Link
        to="/config-manager"
        style={{ ...itemStyle, ...iconOnly }}
        onMouseEnter={(e) => Object.assign(e.target.style, itemHover)}
        onMouseLeave={(e) => Object.assign(e.target.style, itemStyle)}
      >
        📦 {!collapsed && "Configurations"}
      </Link>

      <Link
        to="/templates"
        style={{ ...itemStyle, ...iconOnly }}
        onMouseEnter={(e) => Object.assign(e.target.style, itemHover)}
        onMouseLeave={(e) => Object.assign(e.target.style, itemStyle)}
      >
        📁 {!collapsed && "Templates"}
      </Link>

      <Link
        to="/history"
        style={{ ...itemStyle, ...iconOnly }}
        onMouseEnter={(e) => Object.assign(e.target.style, itemHover)}
        onMouseLeave={(e) => Object.assign(e.target.style, itemStyle)}
      >
        🕒 {!collapsed && "History"}
      </Link>

      <Link
        to="/settings"
        style={{ ...itemStyle, ...iconOnly }}
        onMouseEnter={(e) => Object.assign(e.target.style, itemHover)}
        onMouseLeave={(e) => Object.assign(e.target.style, itemStyle)}
      >
        ⚙ {!collapsed && "Settings"}
      </Link>
    </div>
  );
}
