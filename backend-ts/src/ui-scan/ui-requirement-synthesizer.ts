import { UIPageType } from "./ui-page-classifier";
import { UIComponentSemantic } from "./ui-component-semantic-engine";
import { UIFlowSemantic } from "./ui-flow-semantic-engine";

export interface UISemanticRequirement {
  title: string;
  description: string;
  tags: string[];

  // Raw technical fields preserved for test generation
  selector?: string;
  action?: string;
  componentType?: string;
  semanticRole?: string;
}

export class UIRequirementSynthesizer {
  synthesizeFromComponent(
    pageType: UIPageType,
    component: UIComponentSemantic,
    raw: {
      selector?: string;
      action?: string;
      componentType?: string;
      semanticRole?: string;
    }
  ): UISemanticRequirement {
    const title = this.buildTitle(pageType, component);
    const description = this.buildDescription(pageType, component);

    return {
      title,
      description,
      tags: [pageType, component.kind, component.importance],

      selector: raw.selector,
      action: raw.action,
      componentType: raw.componentType,
      semanticRole: raw.semanticRole
    };
  }

  synthesizeFromFlow(flow: UIFlowSemantic): UISemanticRequirement {
    return {
      title: this.buildFlowTitle(flow),
      description: flow.description,
      tags: [flow.kind],

      selector: undefined,
      action: undefined,
      componentType: undefined,
      semanticRole: undefined
    };
  }

  // -------------------------------
  // Title Builders
  // -------------------------------

  private buildTitle(pageType: UIPageType, component: UIComponentSemantic): string {
    // Carousel controls
    if (component.kind === "carousel-next" || component.kind === "carousel-prev") {
      return "User can navigate the homepage carousel";
    }

    // Footer info
    if (component.kind === "footer-info") {
      return "User can view footer information";
    }

    // Primary buttons
    if (component.importance === "primary") {
      return `The system shall allow the user to ${this.toAction(component.label)}`;
    }

    // Generic buttons / links
    return `User can interact with ${component.label}`;
  }

  private buildFlowTitle(flow: UIFlowSemantic): string {
    switch (flow.kind) {
      case "product-view":
        return "The system shall allow the user to view product details";

      case "cart-navigation":
        return "User can open the cart";

      case "checkout-flow":
        return "User can proceed to checkout";

      case "login-flow":
        return "User can navigate to the login page";

      default:
        return "User can navigate between pages";
    }
  }

  // -------------------------------
  // Description Builders
  // -------------------------------

  private buildDescription(pageType: UIPageType, component: UIComponentSemantic): string {
    if (component.kind === "carousel-next" || component.kind === "carousel-prev") {
      return "The user can move between slides in the homepage carousel.";
    }

    if (component.kind === "footer-info") {
      return "The user can read informational content displayed in the footer.";
    }

    if (component.importance === "primary") {
      return `The system provides a primary action allowing the user to ${this.toAction(component.label)}.`;
    }

    return `The user can interact with the ${component.label} element on the ${pageType} page.`;
  }

  // -------------------------------
  // Helpers
  // -------------------------------

  private toAction(label: string): string {
    const t = label.toLowerCase();

    if (t.includes("login")) return "log in";
    if (t.includes("checkout")) return "proceed to checkout";
    if (t.includes("add")) return "add items";
    if (t.includes("next")) return "move to the next step";

    return label.toLowerCase();
  }
}
