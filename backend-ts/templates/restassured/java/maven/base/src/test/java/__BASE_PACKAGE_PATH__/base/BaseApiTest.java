package {{BASE_PACKAGE}}.base;

import {{BASE_PACKAGE}}.config.ConfigManager;
{{RESTASSURED_REPORTING_FILTER_IMPORT}}
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.filter.log.RequestLoggingFilter;
import io.restassured.filter.log.ResponseLoggingFilter;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
{{TESTRUNNER_BASE_IMPORT}}

/**
 * Parent class for every API test.
 *
 * Builds a shared {@link RequestSpecification} once per suite from config.properties.
 * Any test class extends this and calls {@code given().spec(requestSpec)} to get
 * a pre-configured request with auth, base URI, content-type and report attachment.
 */
public abstract class BaseApiTest {

    protected static final Logger log = LogManager.getLogger(BaseApiTest.class);

    /** Shared specification — built once, reused across all tests. */
    protected static RequestSpecification requestSpec;

    /** Base URI without the path — used in negative/no-auth tests. */
    protected static String baseUri;

    {{TESTRUNNER_BEFORE_ANNOTATION}}
    public {{TESTRUNNER_METHOD_STATIC}}void initSuite() {
        baseUri = ConfigManager.require("api.base.url");
        String authToken = ConfigManager.get("api.auth.token");

        RequestSpecBuilder builder = new RequestSpecBuilder()
                .setBaseUri(baseUri)
                .setContentType(ContentType.JSON)
                .setAccept(ContentType.JSON)
                {{RESTASSURED_REPORTING_FILTER_LINE}}
                .addFilter(new RequestLoggingFilter())   // logs full request to console / log file
                .addFilter(new ResponseLoggingFilter()); // logs full response

        if (authToken != null && !authToken.isBlank()) {
            builder.addHeader("Authorization", "Bearer " + authToken);
        }

        requestSpec = builder.build();
        log.info("Test suite initialised — base URI: {}", baseUri);
    }
}
