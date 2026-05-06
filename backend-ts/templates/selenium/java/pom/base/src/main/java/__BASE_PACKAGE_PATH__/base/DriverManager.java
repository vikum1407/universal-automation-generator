package {{BASE_PACKAGE}}.base;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DriverManager {

    private static final Logger log = LoggerFactory.getLogger(DriverManager.class);
    private static final ThreadLocal<WebDriver> driverHolder = new ThreadLocal<>();

    private DriverManager() {}

    public static void init(String browser) {
        boolean headless = Boolean.parseBoolean(
            System.getProperty("headless", "{{HEADLESS}}")
        );

        WebDriver driver = switch (browser.toLowerCase()) {
            case "firefox" -> {
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions opts = new FirefoxOptions();
                if (headless) opts.addArguments("--headless");
                yield new FirefoxDriver(opts);
            }
            case "edge" -> {
                WebDriverManager.edgedriver().setup();
                yield new EdgeDriver();
            }
            default -> {
                WebDriverManager.chromedriver().setup();
                ChromeOptions opts = new ChromeOptions();
                if (headless) opts.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
                yield new ChromeDriver(opts);
            }
        };

        driver.manage().window().maximize();
        driverHolder.set(driver);
        log.info("WebDriver initialised: {} (headless={})", browser, headless);
    }

    public static WebDriver getDriver() {
        WebDriver d = driverHolder.get();
        if (d == null) throw new IllegalStateException("Driver not initialised for this thread.");
        return d;
    }

    public static void quit() {
        WebDriver d = driverHolder.get();
        if (d != null) {
            d.quit();
            driverHolder.remove();
        }
    }
}
