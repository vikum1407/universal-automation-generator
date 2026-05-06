import { createContext, useContext, useReducer, useCallback } from "react";
import type { ReactNode } from "react";
import type { FrameworkNodeModel } from "../context/FrameworkContext";
import { CATEGORY_META } from "../nodes/types";

// ─── Models ───────────────────────────────────────────────────────────────────

export interface BuilderNodeInstance {
  instanceId: string;
  nodeId: string;
  nodeLabel: string;
  category: string;
  config: Record<string, any>;
  configSchema?: Record<string, any>;
  conflicts: string[];  // nodeIds this instance conflicts with
}

export interface BuilderStateData {
  architecture: BuilderNodeInstance | null;
  components: BuilderNodeInstance[];
  selectedInstanceId: string | null;
  lastError: string | null;
}

export type AddNodeResult = { success: boolean; conflict?: string; replaced?: boolean };

export interface BuilderContextValue extends BuilderStateData {
  addNode: (node: FrameworkNodeModel) => AddNodeResult;
  removeNode: (instanceId: string) => void;
  updateConfig: (instanceId: string, config: Record<string, any>) => void;
  selectNode: (instanceId: string | null) => void;
  reset: () => void;
  getSelectedInstance: () => BuilderNodeInstance | null;
  getAllInstances: () => BuilderNodeInstance[];
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_ARCH";    payload: BuilderNodeInstance }
  | { type: "ADD_COMP";    payload: BuilderNodeInstance }
  | { type: "REPLACE_CAT"; payload: BuilderNodeInstance }
  | { type: "REMOVE";      payload: string }
  | { type: "UPDATE_CFG";  payload: { instanceId: string; config: Record<string, any> } }
  | { type: "SELECT";      payload: string | null }
  | { type: "ERROR";       payload: string }
  | { type: "RESET" };

const INIT: BuilderStateData = {
  architecture: null,
  components: [],
  selectedInstanceId: null,
  lastError: null,
};

function reducer(state: BuilderStateData, action: Action): BuilderStateData {
  switch (action.type) {

    case "SET_ARCH":
      return { ...state, architecture: action.payload, selectedInstanceId: action.payload.instanceId, lastError: null };

    case "ADD_COMP":
      return { ...state, components: [...state.components, action.payload], selectedInstanceId: action.payload.instanceId, lastError: null };

    case "REPLACE_CAT":
      return {
        ...state,
        components: [...state.components.filter(c => c.category !== action.payload.category), action.payload],
        selectedInstanceId: action.payload.instanceId,
        lastError: null,
      };

    case "REMOVE": {
      const isArch = state.architecture?.instanceId === action.payload;
      return {
        ...state,
        architecture: isArch ? null : state.architecture,
        components: state.components.filter(c => c.instanceId !== action.payload),
        selectedInstanceId: state.selectedInstanceId === action.payload ? null : state.selectedInstanceId,
        lastError: null,
      };
    }

    case "UPDATE_CFG": {
      const { instanceId, config } = action.payload;
      if (state.architecture?.instanceId === instanceId) {
        return { ...state, architecture: { ...state.architecture, config } };
      }
      return {
        ...state,
        components: state.components.map(c => c.instanceId === instanceId ? { ...c, config } : c),
      };
    }

    case "SELECT":
      return { ...state, selectedInstanceId: action.payload };

    case "ERROR":
      return { ...state, lastError: action.payload };

    case "RESET":
      return INIT;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INIT);

  const addNode = useCallback((node: FrameworkNodeModel): AddNodeResult => {
    const meta = CATEGORY_META[node.category];
    const isSingle = meta?.singleInstance ?? (node.category === "architecture");

    const instance: BuilderNodeInstance = {
      instanceId: `${node.id}__${Date.now()}`,
      nodeId:     node.id,
      nodeLabel:  node.label,
      category:   node.category,
      config:     {},
      configSchema: node.configSchema,
      conflicts:  node.constraints.conflicts,
    };

    // Architecture is always single-slot replace
    if (node.category === "architecture") {
      dispatch({ type: "SET_ARCH", payload: instance });
      return { success: true, replaced: true };
    }

    // Single-instance category: replace existing in that category
    if (isSingle) {
      dispatch({ type: "REPLACE_CAT", payload: instance });
      return { success: true, replaced: true };
    }

    // Check conflict
    const conflictHit = state.components.find(c => node.constraints.conflicts.includes(c.nodeId));
    if (conflictHit) {
      const msg = `${node.label} conflicts with ${conflictHit.nodeLabel}`;
      dispatch({ type: "ERROR", payload: msg });
      return { success: false, conflict: msg };
    }

    // Check max instances
    const existing = state.components.filter(c => c.nodeId === node.id).length;
    if (node.constraints.maxInstances > 0 && existing >= node.constraints.maxInstances) {
      const msg = `Maximum ${node.constraints.maxInstances} instance(s) of ${node.label}`;
      dispatch({ type: "ERROR", payload: msg });
      return { success: false, conflict: msg };
    }

    dispatch({ type: "ADD_COMP", payload: instance });
    return { success: true };
  }, [state.components]);

  const removeNode = useCallback((instanceId: string) => {
    dispatch({ type: "REMOVE", payload: instanceId });
  }, []);

  const updateConfig = useCallback((instanceId: string, config: Record<string, any>) => {
    dispatch({ type: "UPDATE_CFG", payload: { instanceId, config } });
  }, []);

  const selectNode = useCallback((instanceId: string | null) => {
    dispatch({ type: "SELECT", payload: instanceId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const getSelectedInstance = useCallback((): BuilderNodeInstance | null => {
    if (!state.selectedInstanceId) return null;
    if (state.architecture?.instanceId === state.selectedInstanceId) return state.architecture;
    return state.components.find(c => c.instanceId === state.selectedInstanceId) ?? null;
  }, [state]);

  const getAllInstances = useCallback((): BuilderNodeInstance[] => {
    return [
      ...(state.architecture ? [state.architecture] : []),
      ...state.components,
    ];
  }, [state]);

  return (
    <BuilderContext.Provider value={{
      ...state,
      addNode, removeNode, updateConfig, selectNode,
      reset, getSelectedInstance, getAllInstances,
    }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilderState(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilderState must be used inside BuilderProvider");
  return ctx;
}
