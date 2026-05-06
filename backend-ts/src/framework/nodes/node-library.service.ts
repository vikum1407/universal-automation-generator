import { Injectable } from '@nestjs/common';
import { FrameworkNode, NodeCategory } from './node.model';

import { ARCHITECTURE_NODES }  from './architecture/architecture.nodes';
import { REPORTING_NODES }     from './reporting/reporting.nodes';
import { TEST_RUNNER_NODES }   from './testRunner/test-runner.nodes';
import { DATA_NODES }          from './data/data.nodes';
import { CI_NODES }            from './ci/ci.nodes';
import { LOGGING_NODES }       from './logging/logging.nodes';
import { DISTRIBUTED_NODES }   from './distributed/distributed.nodes';
import { UTILITIES_NODES }     from './utilities/utilities.nodes';
import { AI_NODES }            from './ai/ai.nodes';

// The node catalog is the single source of truth for all available nodes.
// Adding a new tool = add a new entry in the relevant category file. No logic changes.

const ALL_NODES: FrameworkNode[] = [
  ...ARCHITECTURE_NODES,
  ...TEST_RUNNER_NODES,
  ...REPORTING_NODES,
  ...LOGGING_NODES,
  ...DATA_NODES,
  ...CI_NODES,
  ...DISTRIBUTED_NODES,
  ...UTILITIES_NODES,
  ...AI_NODES,
];

@Injectable()
export class NodeLibraryService {

  getAllNodes(): FrameworkNode[] {
    return ALL_NODES;
  }

  getNodeById(id: string): FrameworkNode | undefined {
    return ALL_NODES.find(n => n.id === id);
  }

  getNodesByCategory(category: NodeCategory): FrameworkNode[] {
    return ALL_NODES.filter(n => n.category === category);
  }

  getCategories(): NodeCategory[] {
    return [...new Set(ALL_NODES.map(n => n.category))];
  }

  getTotalCount(): number {
    return ALL_NODES.length;
  }
}
