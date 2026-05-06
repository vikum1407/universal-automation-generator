package {{BASE_PACKAGE}}.base;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.MalformedURLException;
import java.net.URL;

/**
 * Remote WebDriver factory for Selenium Grid 4.
 * Use this alongside DriverManager when running against a remote grid.
 *
 * Grid URL: {{GRID_HUB_URL}}
 */
public class RemoteDriverConfig {

    private static final Logger log = LoggerFactory.getLogger(RemoteDriverConfig.class);
    private static final String GRID_URL = System.getProperty("gridUrl", "{{GRID_HUB_URL}}/wd/hub");

    public static WebDriver createRemoteDriver(String browser) {
        try {
            URL gridUrl = new URL(GRID_URL);
            log.info("Connecting to Selenium Grid: {}", GRID_URL);

            return switch (browser.toLowerCase()) {
                case "firefox" -> new RemoteWebDriver(gridUrl, new FirefoxOptions());
                default        -> new RemoteWebDriver(gridUrl, new ChromeOptions());
            };
        } catch (MalformedURLException e) {
            throw new RuntimeException("Invalid Grid URL: " + GRID_URL, e);
        }
    }
}
