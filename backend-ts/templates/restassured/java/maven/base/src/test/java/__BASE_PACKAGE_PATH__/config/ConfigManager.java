package {{BASE_PACKAGE}}.config;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Single source of truth for runtime configuration.
 *
 * Priority: JVM system property (-Dkey=value) → config.properties → empty string.
 * This means Jenkins / Docker can override any property without touching the file.
 */
public class ConfigManager {

    private static final Logger log = LogManager.getLogger(ConfigManager.class);
    private static final Properties PROPS = new Properties();

    static {
        try (InputStream in = ConfigManager.class.getClassLoader()
                .getResourceAsStream("config.properties")) {
            if (in != null) {
                PROPS.load(in);
                log.info("config.properties loaded successfully");
            } else {
                log.warn("config.properties not found on classpath — using defaults");
            }
        } catch (IOException e) {
            throw new ExceptionInInitializerError(
                    "Failed to load config.properties: " + e.getMessage());
        }
    }

    private ConfigManager() {}

    /** Returns the value of {@code key}, preferring a JVM system property over the file. */
    public static String get(String key) {
        return System.getProperty(key, PROPS.getProperty(key, ""));
    }

    /** Returns the value or throws if blank — use for mandatory settings. */
    public static String require(String key) {
        String value = get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "Required config property '" + key + "' is not set. " +
                    "Set it in src/test/resources/config.properties or as -D" + key + "=<value>.");
        }
        return value;
    }
}
