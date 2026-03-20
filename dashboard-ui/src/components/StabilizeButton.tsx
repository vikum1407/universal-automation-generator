import { useState } from "react";
import { StabilityAPI } from "../api/stability";

export function StabilizeButton({ project }: { project: string }) {
  const [result, setResult] = useState<any>(null);

  async function handleClick() {
    const res = await StabilityAPI.runStabilization(project);
    setResult(res);
  }

  return (
    <div style={{ marginTop: 32 }}>
      <button onClick={handleClick}>Run Stabilization</button>

      {result && (
        <pre style={{ marginTop: 16, fontSize: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
