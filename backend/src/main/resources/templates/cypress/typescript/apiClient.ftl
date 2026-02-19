export const apiClient = {

  request(
    method: string,
    url: string,
    headers: Record<string, string> = {},
    queryParams: Record<string, string> = {},
    body: any = null
  ) {
    return cy.request({
      method,
      url,
      headers,
      qs: queryParams,
      body,
      failOnStatusCode: false
    });
  },

  get(url: string, headers: Record<string, string> = {}, queryParams: Record<string, string> = {}) {
    return this.request("GET", url, headers, queryParams);
  },

  post(url: string, headers: Record<string, string> = {}, queryParams: Record<string, string> = {}, body: any = {}) {
    return this.request("POST", url, headers, queryParams, body);
  },

  put(url: string, headers: Record<string, string> = {}, queryParams: Record<string, string> = {}, body: any = {}) {
    return this.request("PUT", url, headers, queryParams, body);
  },

  delete(url: string, headers: Record<string, string> = {}, queryParams: Record<string, string> = {}) {
    return this.request("DELETE", url, headers, queryParams);
  },

  patch(url: string, headers: Record<string, string> = {}, queryParams: Record<string, string> = {}, body: any = {}) {
    return this.request("PATCH", url, headers, queryParams, body);
  }

};
