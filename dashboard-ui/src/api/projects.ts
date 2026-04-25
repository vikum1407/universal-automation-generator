const API_BASE = "http://localhost:3000";

// ---------------------------------------------------------
// PROJECT LIST + DETAILS
// ---------------------------------------------------------
export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function fetchProject(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  return res.json();
}

// ---------------------------------------------------------
// CREATE UI PROJECT (DB ONLY)
// ---------------------------------------------------------
export async function createUIProject(payload: any) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "ui", ...payload })
  });
  return res.json();
}

// ---------------------------------------------------------
// START UI SCAN (PIPELINE)
// ---------------------------------------------------------
export async function scanUI(payload: any) {
  const res = await fetch(`${API_BASE}/projects/scan-ui`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

// ---------------------------------------------------------
// ANALYTICS (Overview page)
// ---------------------------------------------------------
export async function fetchAnalytics(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}/analytics`);
  return res.json();
}

// ---------------------------------------------------------
// FLOW GRAPH
// ---------------------------------------------------------
export async function fetchFlows(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}/flows`);
  return res.json();
}

// ---------------------------------------------------------
// ENDPOINTS
// ---------------------------------------------------------
export async function fetchEndpoints(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}/endpoints`);
  return res.json();
}

// ---------------------------------------------------------
// RTM
// ---------------------------------------------------------
export async function fetchRTM(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}/rtm`);
  return res.json();
}

// ---------------------------------------------------------
// CI STATUS
// ---------------------------------------------------------
export async function fetchCIStatus(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}/ci-status`);
  return res.json();
}

// ---------------------------------------------------------
// RE-CRAWL
// ---------------------------------------------------------
export async function recrawlProject(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}/recrawl`, {
    method: "POST"
  });
  return res.json();
}
