package {{BASE_PACKAGE}}.util;

import io.restassured.response.Response;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * Fluent custom assertion builder for REST Assured API responses.
 *
 * Works with both TestNG and JUnit5 — uses plain AssertionError, no test-runner imports.
 *
 * Usage:
 *   ApiAssertions.of(response)
 *       .hasStatus(200)
 *       .hasJsonField("id")
 *       .responseTimeBelow(3000)
 *       .assertAll();
 */
public final class ApiAssertions {

    private static final Logger log = LogManager.getLogger(ApiAssertions.class);
    private final Response response;
    private final StringBuilder failures = new StringBuilder();

    private ApiAssertions(Response response) {
        this.response = response;
    }

    public static ApiAssertions of(Response response) {
        return new ApiAssertions(response);
    }

    public ApiAssertions hasStatus(int expected) {
        int actual = response.statusCode();
        if (actual != expected) {
            failures.append(String.format("Expected status %d but got %d. ", expected, actual));
        }
        return this;
    }

    public ApiAssertions hasContentType(String expected) {
        String actual = response.contentType();
        if (actual == null || !actual.contains(expected)) {
            failures.append(String.format("Expected content-type containing '%s' but got '%s'. ", expected, actual));
        }
        return this;
    }

    public ApiAssertions hasJsonField(String jsonPath) {
        Object value = response.jsonPath().get(jsonPath);
        if (value == null) {
            failures.append(String.format("Expected JSON field '%s' to be present. ", jsonPath));
        }
        return this;
    }

    public ApiAssertions jsonFieldEquals(String jsonPath, Object expected) {
        Object actual = response.jsonPath().get(jsonPath);
        if (!expected.equals(actual)) {
            failures.append(String.format("JSON field '%s': expected '%s' but got '%s'. ",
                    jsonPath, expected, actual));
        }
        return this;
    }

    public ApiAssertions responseTimeBelow(long maxMs) {
        long actual = response.time();
        if (actual > maxMs) {
            failures.append(String.format("Response time %dms exceeded limit of %dms. ", actual, maxMs));
        }
        return this;
    }

    public ApiAssertions isNotEmpty() {
        String body = response.getBody().asString();
        if (body == null || body.isBlank()) {
            failures.append("Expected non-empty response body. ");
        }
        return this;
    }

    public ApiAssertions hasErrorMessage() {
        String body = response.getBody().asString();
        boolean hasMessage = body != null && (body.contains("message") || body.contains("error"));
        if (!hasMessage) {
            failures.append("Expected error response to contain 'message' or 'error' field. ");
        }
        return this;
    }

    public void assertAll() {
        if (failures.length() > 0) {
            log.error("Assertion failures: {}", failures);
            throw new AssertionError("API assertion failures:\n" + failures);
        }
        log.debug("All API assertions passed — status: {}", response.statusCode());
    }
}
