const API_BASE = "http://localhost:3000";

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function fetchProject(id: string) {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  return res.json();
}
