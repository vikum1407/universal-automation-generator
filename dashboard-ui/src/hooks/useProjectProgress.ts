import { useContext } from "react";
import { ProgressContext } from "../context/ProgressContext";

export function useProjectProgress() {
  const ctx = useContext(ProgressContext);

  return {
    // state
    isOpen: ctx.isOpen,
    percent: ctx.percent,
    step: ctx.step,
    projectId: ctx.projectId,

    // actions
    openProgress: ctx.openProgress,
    closeProgress: ctx.closeProgress,

    // unified update function
    updateProgress: (data: {
      isOpen?: boolean;
      percent?: number;
      step?: string;
    }) => {
      if (data.isOpen !== undefined) ctx.isOpen = data.isOpen;
      if (data.percent !== undefined) ctx.updateProgress(data.percent, data.step || ctx.step);
      if (data.step !== undefined) ctx.updateProgress(data.percent ?? ctx.percent, data.step);
    }
  };
}
