import type { TimelineEvent } from "../api/types";

export interface StepNode {
  id: string;
  title: string;
  status: string;
  start: number;
  end?: number;
  children: StepNode[];
  parentId?: string;
}

export function buildStepTree(events: TimelineEvent[]): StepNode[] {
  const nodes = new Map<string, StepNode>();
  const roots: StepNode[] = [];

  for (const e of events) {
    const p = e.payload;

    if (p.type === "start") {
      nodes.set(p.stepId, {
        id: p.stepId,
        title: p.title,
        status: "running",
        start: new Date(p.timestamp).getTime(),
        children: [],
        parentId: p.parentId
      });
    }

    if (p.type === "end") {
      const node = nodes.get(p.stepId);
      if (node) {
        node.status = p.status;
        node.end = new Date(p.timestamp).getTime();
      }
    }
  }

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
