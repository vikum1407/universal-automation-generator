export function connectToRunStream(runId: string) {
  const socket = new WebSocket(`ws://localhost:3000/?runId=${runId}`);
  return socket;
}
