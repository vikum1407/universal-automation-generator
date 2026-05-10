package {{BASE_PACKAGE}}.util;

import io.restassured.module.jsv.JsonSchemaValidator;
import io.restassured.response.Response;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.InputStream;

/**
 * JSON Schema response validator for REST Assured.
 *
 * Schema files live in src/test/resources/schemas/.
 * Each file is a standard JSON Schema (Draft-07) document.
 *
 * Usage in a test:
 *   SchemaValidator.assertMatchesSchema(response, "pet.json");
 *
 * Or inline with REST Assured:
 *   .then()
 *     .body(SchemaValidator.matchesSchema("pet.json"));
 */
public final class SchemaValidator {

    private static final Logger log = LogManager.getLogger(SchemaValidator.class);
    private static final String SCHEMA_DIR = "schemas/";

    private SchemaValidator() {}

    public static JsonSchemaValidator matchesSchema(String schemaFileName) {
        InputStream schema = SchemaValidator.class.getClassLoader()
                .getResourceAsStream(SCHEMA_DIR + schemaFileName);
        if (schema == null) {
            throw new IllegalArgumentException(
                "JSON Schema file not found in resources: " + SCHEMA_DIR + schemaFileName);
        }
        log.debug("Validating response against schema: {}", schemaFileName);
        return JsonSchemaValidator.matchesJsonSchema(schema);
    }

    public static void assertMatchesSchema(Response response, String schemaFileName) {
        response.then().body(matchesSchema(schemaFileName));
        log.info("Response body validated against schema: {}", schemaFileName);
    }
}
