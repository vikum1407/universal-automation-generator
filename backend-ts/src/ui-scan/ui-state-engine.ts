export interface UIStateNode {
  id: string;
  url: string;
  label: string;
  invariants: string[];
  driftRisk: number;
  meta?: any;
}

export interface UIStateTransition {
  id: string;
  from: string;      // ensure these exist
  to: string;        // ensure these exist
  selector?: string;
  action?: string;
}

export interface UIStateGraph {
  states: UIStateNode[];
  transitions: UIStateTransition[];
}

export class UIStateEngine {
  buildStateGraph(journeys: any[], scenarios: any[], requirements: any[]): UIStateGraph {
    const states: UIStateNode[] = [];
    const transitions: UIStateTransition[] = [];

    const addState = (url: string) => {
      if (!states.find(s => s.url === url)) {
        states.push({
          id: `state-${states.length + 1}`,
          url,
          label: url,
          invariants: [],
          driftRisk: 0,
          meta: {}
        });
      }
    };

    for (const j of journeys) {
      for (const step of j.steps) {
        addState(step.from);
        addState(step.to);

        transitions.push({
          id: `trans-${transitions.length + 1}`,
          from: step.from,
          to: step.to,
          selector: step.selector,
          action: step.action
        });
      }
    }

    for (const s of scenarios) {
      for (const step of s.steps) {
        addState(step.from);
        addState(step.to);

        transitions.push({
          id: `trans-${transitions.length + 1}`,
          from: step.from,
          to: step.to,
          selector: step.selector,
          action: step.action
        });
      }
    }

    return { states, transitions };
  }
}
