import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { TestCouplingEdge } from "../api/types";

export function useTestCoupling() {
  const [data, setData] = useState<TestCouplingEdge[]>([]);

  useEffect(() => {
    AnalyticsAPI.getTestCoupling().then((value: unknown) => {
      setData(value as TestCouplingEdge[]);
    });
  }, []);

  return { data };
}
