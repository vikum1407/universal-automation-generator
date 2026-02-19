package client;

import java.net.http.*;
import java.net.URI;
import java.util.Map;

public class ApiClient {

    private final String baseUrl;
    private final HttpClient client = HttpClient.newHttpClient();

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    private HttpRequest buildRequest(String method, String url, Map<String, String> headers, Map<String, String> queryParams, String body) {

        String fullUrl = baseUrl + url;

        if (queryParams != null && !queryParams.isEmpty()) {
            StringBuilder sb = new StringBuilder(fullUrl);
            sb.append("?");
            queryParams.forEach((k, v) -> sb.append(k).append("=").append(v).append("&"));
            fullUrl = sb.substring(0, sb.length() - 1);
        }

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(fullUrl));

        if (headers != null) {
            headers.forEach(builder::header);
        }

        switch (method) {
            case "GET" -> builder.GET();
            case "DELETE" -> builder.DELETE();
            default -> builder.method(method, HttpRequest.BodyPublishers.ofString(body != null ? body : ""));
        }

        return builder.build();
    }

    private ApiResponse send(HttpRequest request) throws Exception {
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return new ApiResponse(response.statusCode(), response.body());
    }

    public ApiResponse get(String url, Map<String, String> headers, Map<String, String> queryParams) throws Exception {
        return send(buildRequest("GET", url, headers, queryParams, null));
    }

    public ApiResponse post(String url, Map<String, String> headers, Map<String, String> queryParams, String body) throws Exception {
        return send(buildRequest("POST", url, headers, queryParams, body));
    }

    public ApiResponse put(String url, Map<String, String> headers, Map<String, String> queryParams, String body) throws Exception {
        return send(buildRequest("PUT", url, headers, queryParams, body));
    }

    public ApiResponse patch(String url, Map<String, String> headers, Map<String, String> queryParams, String body) throws Exception {
        return send(buildRequest("PATCH", url, headers, queryParams, body));
    }

    public ApiResponse delete(String url, Map<String, String> headers, Map<String, String> queryParams) throws Exception {
        return send(buildRequest("DELETE", url, headers, queryParams, null));
    }
}
