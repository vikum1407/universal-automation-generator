export interface APIEndpoint {
  method: string;
  url: string;
  requestBody: any | null;
  status: number | null;
  responseBody: any | null;
}
