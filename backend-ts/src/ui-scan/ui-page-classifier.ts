export type UIPageType =
  | "home"
  | "product"
  | "cart"
  | "login"
  | "checkout"
  | "category"
  | "search"
  | "generic";

export class UIPageClassifier {
  classify(pageUrl: string, textContent: string): UIPageType {
    const url = pageUrl.toLowerCase();
    const text = (textContent || "").toLowerCase();

    // --- URL-based heuristics ---
    if (url.includes("index") || url.endsWith("/") || url.includes("home")) {
      return "home";
    }

    if (url.includes("product") || url.includes("item") || url.includes("details")) {
      return "product";
    }

    if (url.includes("cart")) {
      return "cart";
    }

    if (url.includes("login") || url.includes("signin")) {
      return "login";
    }

    if (url.includes("checkout")) {
      return "checkout";
    }

    if (url.includes("category")) {
      return "category";
    }

    if (url.includes("search") || url.includes("query")) {
      return "search";
    }

    // --- Text-based heuristics ---
    if (text.includes("add to cart") && text.includes("product")) {
      return "product";
    }

    if (text.includes("login") || text.includes("sign in")) {
      return "login";
    }

    if (text.includes("checkout")) {
      return "checkout";
    }

    if (text.includes("category")) {
      return "category";
    }

    if (text.includes("search")) {
      return "search";
    }

    // Default fallback
    return "generic";
  }
}
