package {{BASE_PACKAGE}}.util;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Reads CSV files from the classpath (src/test/resources/testdata/) and
 * converts them into a TestNG {@code Object[][]} data-provider format.
 *
 * The first row must be the header. Every subsequent row is one test case.
 *
 * Quick start:
 * <pre>
 *   \@DataProvider(name = "users")
 *   public Object[][] userData() {
 *       return CsvDataReader.asObjectArray("testdata/users.csv");
 *   }
 *
 *   \@Test(dataProvider = "users")
 *   public void createUser(Map\<String, String\> row) {
 *       String email = row.get("email");
 *       // ...
 *   }
 * </pre>
 *
 * To inject your own test data: drop a CSV into {@code src/test/resources/testdata/}
 * with headers matching the field names your tests expect, then re-run.
 */
public final class CsvDataReader {

    private static final Logger log = LogManager.getLogger(CsvDataReader.class);

    private CsvDataReader() {}

    /**
     * Returns rows as {@code Object[][]} for TestNG {@code @DataProvider}.
     * Each element is a {@code Map<String, String>} of column → value.
     */
    public static Object[][] asObjectArray(String classpathPath) {
        List<Map<String, String>> rows = readRows(classpathPath);
        Object[][] result = new Object[rows.size()][1];
        for (int i = 0; i < rows.size(); i++) {
            result[i][0] = rows.get(i);
        }
        return result;
    }

    /** Returns the first data row, or an empty map if the file has no data rows. Used by JUnit5 tests. */
    public static Map<String, String> firstRow(String classpathPath) {
        List<Map<String, String>> rows = readRows(classpathPath);
        return rows.isEmpty() ? new LinkedHashMap<>() : rows.get(0);
    }

    /** Returns all rows as a list of maps. */
    public static List<Map<String, String>> readRows(String classpathPath) {
        List<Map<String, String>> rows = new ArrayList<>();
        URL resource = CsvDataReader.class.getClassLoader().getResource(classpathPath);
        if (resource == null) {
            log.warn("Test data file not found on classpath: {}", classpathPath);
            return rows;
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.openStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) return rows;

            String[] headers = splitCsv(headerLine);
            String line;

            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] values = splitCsv(line);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    row.put(headers[i].trim(), i < values.length ? values[i].trim() : "");
                }
                rows.add(row);
            }

        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read test data file: " + classpathPath, e);
        }

        log.debug("Loaded {} rows from {}", rows.size(), classpathPath);
        return rows;
    }

    // Handles quoted fields containing commas
    private static String[] splitCsv(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuote = false;

        for (char ch : line.toCharArray()) {
            if (ch == '"') {
                inQuote = !inQuote;
            } else if (ch == ',' && !inQuote) {
                fields.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(ch);
            }
        }
        fields.add(cur.toString());
        return fields.toArray(new String[0]);
    }
}
