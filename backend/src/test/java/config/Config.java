package config;

import java.util.Map;

public class Config {

    private String baseUrl;
    private String authToken;
    private Map<String, String> headers;

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getAuthToken() {
        return authToken;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }
}
