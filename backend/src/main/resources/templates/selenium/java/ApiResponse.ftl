package client;

import java.util.Map;

public class ApiResponse {

    private final int status;
    private final String body;
    private final Map<String, java.util.List<String>> headers;

    public ApiResponse(int status, String body, Map<String, java.util.List<String>> headers) {
        this.status = status;
        this.body = body;
        this.headers = headers;
    }

    public int getStatus() {
        return status;
    }

    public String getBody() {
        return body;
    }

    public Map<String, java.util.List<String>> getHeaders() {
        return headers;
    }
}
