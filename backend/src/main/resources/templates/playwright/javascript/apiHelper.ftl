import config from "../config/${environment}.json";

export function buildUrl(path) {
  return config.baseUrl + path;
}

export function buildHeaders(metadataHeaders) {
  let headers = {};

  // Config-level headers
  if (config.headers) {
    headers = { ...headers, ...config.headers };
  }

  // Metadata headers
  if (metadataHeaders) {
    for (const key in metadataHeaders) {
      headers[key] = metadataHeaders[key];
    }
  }

  return headers;
}

export function buildQueryParams(metadataParams, apiKeyQueryName, apiKeyQueryValue, authType) {
  let params = {};

  // API Key in query
  if (authType === "API_KEY_QUERY") {
    params[apiKeyQueryName] = apiKeyQueryValue;
  }

  // Metadata query params
  if (metadataParams) {
    for (const key in metadataParams) {
      params[key] = metadataParams[key];
    }
  }

  return params;
}
