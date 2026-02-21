import config from "../config/${environment}.json";

export function buildUrl(path: string): string {
  return config.baseUrl + path;
}

export function buildHeaders(metadataHeaders: Record<string, string>): Record<string, string> {
  let headers: Record<string, string> = {};

  if (config.headers) {
    headers = { ...headers, ...config.headers };
  }

  if (metadataHeaders) {
    for (const key in metadataHeaders) {
      headers[key] = metadataHeaders[key];
    }
  }

  return headers;
}

export function buildQueryParams(
  metadataParams: Record<string, string>,
  apiKeyQueryName: string,
  apiKeyQueryValue: string,
  authType: string
): Record<string, string> {

  let params: Record<string, string> = {};

  if (authType === "API_KEY_QUERY") {
    params[apiKeyQueryName] = apiKeyQueryValue;
  }

  if (metadataParams) {
    for (const key in metadataParams) {
      params[key] = metadataParams[key];
    }
  }

  return params;
}
