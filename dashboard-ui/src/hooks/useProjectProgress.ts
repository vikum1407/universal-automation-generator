import { useContext } from "react";
import { ProgressContext } from "../context/ProgressContext";

export function useProjectProgress() {
  const ctx = useContext(ProgressContext);
  return {
    openProgress: ctx.openProgress,
    closeProgress: ctx.closeProgress,
    projectId: ctx.projectId,
    percent: ctx.percent,
    step: ctx.step,
    isOpen: ctx.isOpen
  };
}
