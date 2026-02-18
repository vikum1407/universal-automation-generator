package client;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

public class ApiClient {

    private final HttpClient client;
    private final String baseUrl;

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ?
                baseUrl.substring(0, baseUrl.length() - 1) :
                baseUrl;

        this.client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    // -------------------------------
    // Public API Methods
    // -------------------------------

    public ApiResponse get(String path, Map<String, String> headers, Map<String, String> queryParams)
            throws IOException, InterruptedException {
        return sendRequest("GET", path, headers, queryParams, null);
    }

    public ApiResponse post(String path, Map<String, String> headers, Map<String, String> queryParams, String body)
            throws IOException, InterruptedException {
        return sendRequest("POST", path, headers, queryParams, body);
    }

    public ApiResponse put(String path, Map<String, String> headers, Map<String, String> queryParams, String body)
            throws IOException, InterruptedException {
        return sendRequest("PUT", path, headers, queryParams, body);
    }

    public ApiResponse delete(String path, Map<String, String> headers, Map<String, String> queryParams)
            throws IOException, InterruptedException {
        return sendRequest("DELETE", path, headers, queryParams, null);
    }

    public ApiResponse patch(String path, Map<String, String> headers, Map<String, String> queryParams, String body)
            throws IOException, InterruptedException {
        return sendRequest("PATCH", path, headers, queryParams, body);
    }

    // -------------------------------
    // Core Request Builder
    // -------------------------------

    private ApiResponse sendRequest(
            String method,
            String path,
            Map<String, String> headers,
            Map<String, String> queryParams,
            String body
    ) throws IOException, InterruptedException {

        String fullUrl = buildUrl(path, queryParams);

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(fullUrl))
                .timeout(Duration.ofSeconds(20));

        // Add headers
        if (headers != null) {
            headers.forEach(builder::header);
        }

        // Add body if needed
        if (body != null && !body.isEmpty()) {
            builder.method(method, HttpRequest.BodyPublishers.ofString(body));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }

        HttpRequest request = builder.build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        return new ApiResponse(
                response.statusCode(),
                response.body(),
                response.headers().map()
        );
    }

    // -------------------------------
    // URL Builder
    // -------------------------------

    private String buildUrl(String path, Map<String, String> queryParams) {
        StringBuilder url = new StringBuilder(baseUrl);

        if (!path.startsWith("/")) {
            url.append("/");
        }
        url.append(path);

        if (queryParams != null && !queryParams.isEmpty()) {
            url.append("?");
            queryParams.forEach((key, value) -> {
                url.append(encode(key))
                   .append("=")
                   .append(encode(value))
                   .append("&");
            });
            url.deleteCharAt(url.length() - 1); // remove last &
        }

        return url.toString();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}