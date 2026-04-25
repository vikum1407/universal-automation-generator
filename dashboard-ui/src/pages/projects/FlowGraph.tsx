import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from "reactflow";
import "reactflow/dist/style.css";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

const CustomNode = ({ data }: any) => {
  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const accent = stringToColor(data.pageUrl || "");

  return (
    <div
      onClick={() => data.fullUrl && window.open(data.fullUrl, "_blank")}
      style={{
        padding: "12px 14px",
        borderRadius: "12px",
        border: `2px solid ${accent}`,
        background: surface,
        color: text,
        fontWeight: 600,
        cursor: "pointer",
        width: "240px",
        textAlign: "left",
        whiteSpace: "normal",
        wordBreak: "break-word",
        boxShadow: theme.shadow.card,
        fontSize: "13px",
        transition: "all 0.15s ease"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 6px 14px rgba(0,0,0,0.18)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadow.card;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
      title={`${data.fullUrl || ""}\n${data.selector || ""}`}
    >
      <div
        style={{
          fontSize: "11px",
          opacity: 0.7,
          marginBottom: 4,
          color: theme.mode === "dark" ? theme.colors.darkTextLight : "#666"
        }}
      >
        {data.pageUrl ? new URL(data.pageUrl).hostname : ""}
      </div>

      <div>{data.label}</div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default function FlowGraph({ projectId }: { projectId: string }) {
  const [graph, setGraph] = useState<any>(null);

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  // ---------------------------------------------------------
  // LOAD NEW FLOW GRAPH FORMAT
  // ---------------------------------------------------------
  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flows`)
      .then(res => res.json())
      .then(setGraph)
      .catch(() => setGraph(null));
  }, [projectId]);

  if (!graph || !graph.nodes?.length) return null;

  // ---------------------------------------------------------
  // MAP NODES
  // ---------------------------------------------------------
  const nodes = graph.nodes.map((n: any, index: number) => ({
    id: n.id,
    position: {
      x: (index % 5) * 280,
      y: Math.floor(index / 5) * 180
    },
    data: {
      label: n.text || n.selector || "(element)",
      fullUrl: n.pageUrl,
      selector: n.selector,
      pageUrl: n.pageUrl
    },
    type: "customNode"
  }));

  // ---------------------------------------------------------
  // MAP EDGES
  // ---------------------------------------------------------
  const edges = graph.edges.map((e: any, index: number) => ({
    id: e.id || `edge-${index}`,
    source: e.from,
    target: e.to,
    label: e.action,
    animated: true,
    style: {
      stroke: theme.colors.primary,
      strokeWidth: 2
    },
    labelStyle: {
      fill: theme.colors.primary,
      fontWeight: 600,
      fontSize: 11
    }
  }));

  return (
    <div
      style={{
        height: "600px",
        border: `1px solid ${border}`,
        borderRadius: "12px",
        marginTop: "16px",
        background:
          theme.mode === "dark"
            ? theme.colors.darkBackground
            : theme.colors.background
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodeTypes={{ customNode: CustomNode }}
      >
        <Background
          color={theme.mode === "dark" ? "#444" : "#ddd"}
          gap={16}
        />
        <Controls />
        <MiniMap
          nodeColor={() =>
            theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background
          }
          maskColor={
            theme.mode === "dark"
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.05)"
          }
        />
      </ReactFlow>
    </div>
  );
}
