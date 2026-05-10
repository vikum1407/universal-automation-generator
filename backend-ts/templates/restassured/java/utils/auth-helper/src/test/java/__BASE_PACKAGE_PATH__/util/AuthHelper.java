package {{BASE_PACKAGE}}.util;

import io.restassured.builder.RequestSpecBuilder;
import io.restassured.specification.RequestSpecification;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Base64;
import java.util.Map;

/**
 * Centralised authentication helper for REST Assured tests.
 *
 * Provides ready-to-use strategies:
 *   - Bearer token  : AuthHelper.withBearer(spec, token)
 *   - API key       : AuthHelper.withApiKey(spec, header, key)
 *   - Basic Auth    : AuthHelper.withBasic(spec, user, password)
 *   - No auth       : AuthHelper.withNoAuth(spec)  — for negative security tests
 *
 * All methods return a new RequestSpecification derived from the base spec
 * so the shared BaseApiTest.requestSpec is never mutated.
 */
public final class AuthHelper {

    private static final Logger log = LogManager.getLogger(AuthHelper.class);

    private AuthHelper() {}

    public static RequestSpecification withBearer(RequestSpecification base, String token) {
        log.debug("Applying Bearer token auth");
        return new RequestSpecBuilder()
                .addRequestSpecification(base)
                .addHeader("Authorization", "Bearer " + token)
                .build();
    }

    public static RequestSpecification withApiKey(RequestSpecification base, String headerName, String key) {
        log.debug("Applying API key auth via header: {}", headerName);
        return new RequestSpecBuilder()
                .addRequestSpecification(base)
                .addHeader(headerName, key)
                .build();
    }

    public static RequestSpecification withBasic(RequestSpecification base, String username, String password) {
        log.debug("Applying Basic Auth for user: {}", username);
        String encoded = Base64.getEncoder().encodeToString((username + ":" + password).getBytes());
        return new RequestSpecBuilder()
                .addRequestSpecification(base)
                .addHeader("Authorization", "Basic " + encoded)
                .build();
    }

    public static RequestSpecification withQueryApiKey(RequestSpecification base, String paramName, String key) {
        log.debug("Applying API key via query param: {}", paramName);
        return new RequestSpecBuilder()
                .addRequestSpecification(base)
                .addQueryParam(paramName, key)
                .build();
    }

    /**
     * Returns a spec with no auth headers — use for security/negative tests
     * that verify 401/403 responses.
     */
    public static RequestSpecification withNoAuth(RequestSpecification base) {
        return new RequestSpecBuilder()
                .addRequestSpecification(base)
                .removeHeader("Authorization")
                .build();
    }

    /**
     * Builds a spec from explicit headers map — useful for custom auth schemes.
     */
    public static RequestSpecification withHeaders(RequestSpecification base, Map<String, String> headers) {
        RequestSpecBuilder builder = new RequestSpecBuilder().addRequestSpecification(base);
        headers.forEach(builder::addHeader);
        return builder.build();
    }
}
