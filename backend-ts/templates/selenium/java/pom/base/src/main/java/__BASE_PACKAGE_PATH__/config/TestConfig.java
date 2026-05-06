package {{BASE_PACKAGE}}.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class TestConfig {

    private static TestConfig instance;
    private final Properties props = new Properties();

    private TestConfig() {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("config.properties")) {
            if (in != null) props.load(in);
        } catch (IOException e) {
            throw new RuntimeException("Cannot load config.properties", e);
        }
    }

    public static synchronized TestConfig getInstance() {
        if (instance == null) instance = new TestConfig();
        return instance;
    }

    public String getBaseUrl() {
        return System.getProperty("baseUrl", props.getProperty("base.url", "{{BASE_URL}}"));
    }

    public String getBrowser() {
        return System.getProperty("browser", props.getProperty("browser", "{{BROWSER}}"));
    }

    public boolean isHeadless() {
        return Boolean.parseBoolean(System.getProperty("headless", props.getProperty("headless", "{{HEADLESS}}")));
    }

    public int getTimeout() {
        return Integer.parseInt(props.getProperty("timeout.seconds", "30"));
    }

    public int getThreadCount() {
        return Integer.parseInt(props.getProperty("thread.count", "{{THREAD_COUNT}}"));
    }
}
