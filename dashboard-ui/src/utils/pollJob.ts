export const pollJob = (jobId: string, onDone: () => void) => {
  const interval = setInterval(async () => {
    const res = await fetch(`http://localhost:3000/jobs/${jobId}/status`);
    const { status } = await res.json();

    if (status === "completed" || status === "failed") {
      clearInterval(interval);
      onDone();
    }
  }, 1500);
};
