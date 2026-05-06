import type { StyleTokens } from "../nodes/types";
import { CATEGORY_META } from "../nodes/types";
import { useFramework } from "../context/FrameworkContext";
import { useBuilderState } from "./useBuilderState";
import { NodeSlot } from "./NodeSlot";

interface BuilderCanvasProps {
  activeDragCategory: string | null;
  S: StyleTokens;
}

export function BuilderCanvas({ activeDragCategory, S }: BuilderCanvasProps) {
  const { result } = useFramework();
  const { architecture, components, lastError } = useBuilderState();

  // Derive which categories exist in the node catalog for this framework+language
  const availableCategories = result
    ? [...new Set(result.nodes.map(n => n.category))].sort((a, b) => {
        const oa = CATEGORY_META[a]?.order ?? 99;
        const ob = CATEGORY_META[b]?.order ?? 99;
        return oa - ob;
      })
    : [];

  const getInstancesForCategory = (category: string) => {
    if (category === "architecture") return architecture ? [architecture] : [];
    return components.filter(c => c.category === category);
  };

  const totalPlaced = (architecture ? 1 : 0) + components.length;

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      background: S.bg,
      padding: "24px 28px 60px",
    }}>
      {/* Canvas header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: S.text }}>
            Architecture Canvas
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>
            {totalPlaced === 0
              ? "Drag nodes from the library to start building"
              : `${totalPlaced} node${totalPlaced !== 1 ? "s" : ""} placed`}
          </p>
        </div>
      </div>

      {/* Conflict / error banner */}
      {lastError && (
        <div style={{
          marginBottom: 18, padding: "10px 14px", borderRadius: 8,
          background: "#EF444414", border: "1px solid #EF444440",
          fontSize: 12, color: "#EF4444",
        }}>
          ⚠ {lastError}
        </div>
      )}

      {/* Slots */}
      {availableCategories.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 0",
          color: S.textDim, fontSize: 13,
        }}>
          Go back and select a framework + language to load nodes.
        </div>
      ) : (
        availableCategories.map(category => (
          <NodeSlot
            key={category}
            category={category}
            instances={getInstancesForCategory(category)}
            activeDragCategory={activeDragCategory}
            S={S}
          />
        ))
      )}
    </div>
  );
}
