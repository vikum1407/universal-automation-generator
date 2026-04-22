export interface UIComponentSemantic {
  kind: string;          // e.g., "carousel-control", "footer-info", "product-link"
  label: string;         // human-readable label
  importance: "primary" | "secondary" | "generic";
}

export class UIComponentSemanticEngine {
  interpret(
    componentType: string | undefined,
    semanticRole: string | undefined,
    action: string | undefined,
    text: string | undefined
  ): UIComponentSemantic {
    const t = (text || "").toLowerCase();

    // --- Carousel controls ---
    if (t === "next" || action === "next") {
      return {
        kind: "carousel-next",
        label: "Next slide button",
        importance: "generic"
      };
    }

    if (t === "previous" || t === "prev") {
      return {
        kind: "carousel-prev",
        label: "Previous slide button",
        importance: "generic"
      };
    }

    // --- Footer / info blocks ---
    if (componentType === "text-block" && t.includes("about us")) {
      return {
        kind: "footer-info",
        label: "Footer information block",
        importance: "generic"
      };
    }

    // --- Buttons ---
    if (componentType === "button") {
      if (semanticRole === "primary-action") {
        return {
          kind: "primary-button",
          label: this.cleanLabel(text),
          importance: "primary"
        };
      }

      return {
        kind: "button",
        label: this.cleanLabel(text),
        importance: "generic"
      };
    }

    // --- Links ---
    if (componentType === "link") {
      return {
        kind: "link",
        label: this.cleanLabel(text),
        importance: "generic"
      };
    }

    // --- Inputs ---
    if (componentType === "input-field") {
      return {
        kind: "input-field",
        label: this.cleanLabel(text),
        importance: "generic"
      };
    }

    // --- Fallback ---
    return {
      kind: "element",
      label: this.cleanLabel(text),
      importance: "generic"
    };
  }

  private cleanLabel(text?: string): string {
    if (!text) return "UI element";
    return text.trim().replace(/\s+/g, " ");
  }
}
