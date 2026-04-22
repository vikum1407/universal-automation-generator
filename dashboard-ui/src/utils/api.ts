export const api = {
  get: async (url: string) => {
    const res = await fetch(`http://localhost:3000${url}`);
    return res.json();
  },

  post: async (url: string, body?: any) => {
    const res = await fetch(`http://localhost:3000${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
  },

  put: async (url: string, body?: any) => {
    const res = await fetch(`http://localhost:3000${url}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
  },

  delete: async (url: string) => {
    const res = await fetch(`http://localhost:3000${url}`, {
      method: "DELETE"
    });
    return res.json();
  }
};
