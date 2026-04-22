import { UIFlowGraph } from "./ui-flow-detector";

export interface UIFlowSemantic {
  kind: string;        // e.g., "page-navigation", "product-view", "checkout-flow"
  label: string;       // human-readable label
  description: string; // semantic description
}

export class UIFlowSemanticEngine {
  interpret(flowGraph: UIFlowGraph): UIFlowSemantic[] {
    const semantics: UIFlowSemantic[] = [];

    flowGraph.edges.forEach(edge => {
      const from = edge.from.toLowerCase();
      const to = edge.to.toLowerCase();

      // --- Product navigation ---
      if (to.includes("prod") || to.includes("item") || to.includes("details")) {
        semantics.push({
          kind: "product-view",
          label: "User views a product",
          description: `User navigates from ${edge.from} to a product detail page.`
        });
        return;
      }

      // --- Cart navigation ---
      if (to.includes("cart")) {
        semantics.push({
          kind: "cart-navigation",
          label: "User opens the cart",
          description: `User navigates from ${edge.from} to the cart page.`
        });
        return;
      }

      // --- Checkout flow ---
      if (to.includes("checkout")) {
        semantics.push({
          kind: "checkout-flow",
          label: "User proceeds to checkout",
          description: `User navigates from ${edge.from} to the checkout page.`
        });
        return;
      }

      // --- Login flow ---
      if (to.includes("login") || to.includes("signin")) {
        semantics.push({
          kind: "login-flow",
          label: "User navigates to login",
          description: `User navigates from ${edge.from} to the login page.`
        });
        return;
      }

      // --- Generic navigation ---
      semantics.push({
        kind: "page-navigation",
        label: "User navigates between pages",
        description: `User navigates from ${edge.from} to ${edge.to}.`
      });
    });

    return semantics;
  }
}
