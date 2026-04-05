const API_BASE = "http://localhost:3000";

export const api = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
};
