package {{BASE_PACKAGE}}.util;

import com.github.javafaker.Faker;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.*;

/**
 * Centralised test data factory backed by JavaFaker.
 *
 * Every generated test that needs a value calls one of the typed methods here.
 * This keeps test data consistent across the suite and makes it trivial to
 * swap in custom values by editing a single class.
 *
 * Bulk data injection: drop a CSV into src/test/resources/testdata/ and use
 * CsvDataReader.asObjectArray() in a TestNG @DataProvider to feed it in.
 *
 * Usage:
 *   String email = TestDataFaker.email();
 *   Map<String, Object> body = TestDataFaker.buildBody("{\"type\":\"object\"}");
 */
public final class TestDataFaker {

    private static final Logger log = LogManager.getLogger(TestDataFaker.class);
    private static final Faker faker = new Faker(Locale.ENGLISH);

    private TestDataFaker() {}

    // ─── Primitive generators ──────────────────────────────────────────────────

    public static String name()          { return faker.name().fullName(); }
    public static String firstName()     { return faker.name().firstName(); }
    public static String lastName()      { return faker.name().lastName(); }
    public static String email()         { return faker.internet().emailAddress(); }
    public static String username()      { return faker.name().username(); }
    public static String password()      { return faker.internet().password(12, 24, true, true, true); }
    public static String phone()         { return faker.phoneNumber().cellPhone(); }
    public static String address()       { return faker.address().fullAddress(); }
    public static String city()          { return faker.address().city(); }
    public static String country()       { return faker.address().country(); }
    public static String uuid()          { return UUID.randomUUID().toString(); }
    public static int    positiveInt()   { return faker.number().numberBetween(1, 10_000); }
    public static int    negativeInt()   { return faker.number().numberBetween(-10_000, -1); }
    public static double price()         { return Math.round(faker.number().randomDouble(2, 1, 9999) * 100.0) / 100.0; }
    public static String sentence()      { return faker.lorem().sentence(); }
    public static String word()          { return faker.lorem().word(); }
    public static String url()           { return faker.internet().url(); }
    public static String companyName()   { return faker.company().name(); }
    public static String productName()   { return faker.commerce().productName(); }
    public static String isoDate()       {
        return "2024-" + String.format("%02d", faker.number().numberBetween(1, 12))
                       + "-" + String.format("%02d", faker.number().numberBetween(1, 28));
    }

    // ─── Boundary / negative values ────────────────────────────────────────────

    public static String emptyString()   { return ""; }
    public static String blankString()   { return "   "; }
    public static String longString()    { return faker.lorem().characters(5000); }
    public static String sqlInjection()  { return "' OR '1'='1"; }
    public static String xssPayload()    { return "<script>alert('xss')</script>"; }
    public static String specialChars()  { return "!@#$%^&*()_+{}|:<>?"; }

    // ─── Path / query parameter resolver ──────────────────────────────────────

    /**
     * Returns a contextually appropriate fake value for a named API parameter.
     * The name heuristic covers the most common REST API patterns.
     */
    public static String forParam(String name, String type) {
        String lower = name.toLowerCase();
        if (lower.contains("email"))                                    return email();
        if (lower.contains("name") && !lower.contains("user"))         return name();
        if (lower.contains("username"))                                 return username();
        if (lower.contains("phone"))                                    return phone();
        if (lower.contains("uuid"))                                     return uuid();
        if (lower.contains("id"))                                       return String.valueOf(positiveInt());
        if (lower.contains("date"))                                     return isoDate();
        if (lower.contains("url") || lower.contains("link"))           return url();
        if (lower.contains("city"))                                     return city();
        if (lower.contains("country"))                                  return country();
        if (lower.contains("address"))                                  return address();
        if (lower.contains("price") || lower.contains("amount") || lower.contains("cost"))
                                                                        return String.valueOf(price());
        if ("integer".equalsIgnoreCase(type) || "int".equalsIgnoreCase(type)
                || "number".equalsIgnoreCase(type))                     return String.valueOf(positiveInt());
        return word();
    }

    // ─── Request body builder ──────────────────────────────────────────────────

    /**
     * Builds a minimal valid request body from a JSON Schema string.
     * Reads the "properties" object via Jackson so only real field names are used —
     * avoids generating values for schema keywords like "$ref" or "type".
     */
    public static Map<String, Object> buildBody(String schemaJson) {
        Map<String, Object> body = new LinkedHashMap<>();
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode schema = mapper.readTree(schemaJson);
            com.fasterxml.jackson.databind.JsonNode props = schema.path("properties");
            if (!props.isMissingNode() && props.isObject()) {
                java.util.Iterator<java.util.Map.Entry<String, com.fasterxml.jackson.databind.JsonNode>> fields = props.fields();
                while (fields.hasNext()) {
                    java.util.Map.Entry<String, com.fasterxml.jackson.databind.JsonNode> entry = fields.next();
                    String key = entry.getKey();
                    com.fasterxml.jackson.databind.JsonNode fieldSchema = entry.getValue();
                    String type = fieldSchema.path("type").asText("string");
                    // Use first enum value if present, otherwise generate by type/name
                    com.fasterxml.jackson.databind.JsonNode enumNode = fieldSchema.path("enum");
                    if (enumNode.isArray() && enumNode.size() > 0) {
                        body.put(key, enumNode.get(0).asText());
                    } else {
                        body.put(key, forParam(key, type));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Schema body build failed — using fallback payload: {}", e.getMessage());
        }
        if (body.isEmpty()) {
            body.put("name",  name());
            body.put("email", email());
        }
        return body;
    }

    // ─── Bulk row generator ────────────────────────────────────────────────────

    /**
     * Generates {@code count} rows of fake data with the given column names.
     * Use with CsvDataReader for bulk data-driven tests.
     */
    public static List<Map<String, String>> generateRows(List<String> columns, int count) {
        List<Map<String, String>> rows = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, String> row = new LinkedHashMap<>();
            for (String col : columns) {
                row.put(col, forParam(col, "string"));
            }
            rows.add(row);
        }
        return rows;
    }
}
