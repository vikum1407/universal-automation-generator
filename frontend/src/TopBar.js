import React from "react";

export default function TopBar({ theme, toggleTheme, colors }) {
  return (
    <div
      style={{
        height: "55px",
        background: colors.card,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}
    >
      {/* LEFT: APP TITLE */}
      <div style={{ fontSize: "18px", fontWeight: "600", color: colors.text }}>
        Automation Framework Generator
      </div>

      {/* RIGHT: THEME TOGGLE + AVATAR */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* THEME SWITCH */}
        <div
          onClick={toggleTheme}
          style={{
            width: "50px",
            height: "24px",
            background: theme === "light" ? "#ccc" : "#555",
            borderRadius: "20px",
            position: "relative",
            cursor: "pointer",
            transition: "0.3s"
          }}
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              background: "#fff",
              borderRadius: "50%",
              position: "absolute",
              top: "1px",
              left: theme === "light" ? "2px" : "26px",
              transition: "0.3s"
            }}
          ></div>
        </div>

        {/* USER AVATAR */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#888",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          V
        </div>
      </div>
    </div>
  );
}
