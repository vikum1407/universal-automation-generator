import { createContext, useState, useCallback, type ReactNode } from "react";

interface ProgressState {
  isOpen: boolean;
  projectId: string | null;
  percent: number;
  step: string;
  openProgress: (projectId: string) => void;
  closeProgress: () => void;
  updateProgress: (percent: number, step: string) => void;
}

export const ProgressContext = createContext<ProgressState>({
  isOpen: false,
  projectId: null,
  percent: 0,
  step: "",
  openProgress: () => {},
  closeProgress: () => {},
  updateProgress: () => {}
});

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [step, setStep] = useState("");

  const openProgress = useCallback((id: string) => {
    setProjectId(id);
    setPercent(0);
    setStep("Starting…");
    setIsOpen(true);
  }, []);

  const closeProgress = useCallback(() => {
    setIsOpen(false);
    setProjectId(null);
    setPercent(0);
    setStep("");
  }, []);

  const updateProgress = useCallback((p: number, s: string) => {
    setPercent(p);
    setStep(s);
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        isOpen,
        projectId,
        percent,
        step,
        openProgress,
        closeProgress,
        updateProgress
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}
