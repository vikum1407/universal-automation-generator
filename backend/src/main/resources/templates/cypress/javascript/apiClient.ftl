export const apiClient = {

  request(method, url, headers = {}, queryParams = {}, body = null) {
    return cy.request({
      method,
      url,
      headers,
      qs: queryParams,
      body,
      failOnStatusCode: false
    });
  },

  get(url, headers = {}, queryParams = {}) {
    return this.request("GET", url, headers, queryParams);
  },

  post(url, headers = {}, queryParams = {}, body = {}) {
    return this.request("POST", url, headers, queryParams, body);
  },

  put(url, headers = {}, queryParams = {}, body = {}) {
    return this.request("PUT", url, headers, queryParams, body);
  },

  delete(url, headers = {}, queryParams = {}) {
    return this.request("DELETE", url, headers, queryParams);
  },

  patch(url, headers = {}, queryParams = {}, body = {}) {
    return this.request("PATCH", url, headers, queryParams, body);
  }

};
