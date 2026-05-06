package {{BASE_PACKAGE}}.base;

import {{BASE_PACKAGE}}.config.TestConfig;
{{REPORTING_IMPORT}}
import org.openqa.selenium.WebDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Optional;
import org.testng.annotations.Parameters;

{{REPORTING_ANNOTATION}}
public abstract class BaseTest {

    protected final Logger log = LoggerFactory.getLogger(getClass());

    @BeforeMethod(alwaysRun = true)
    @Parameters("browser")
    public void setUp(@Optional("{{BROWSER}}") String browser) {
        DriverManager.init(browser);
        log.info("Browser started: {}", browser);
    }

    @AfterMethod(alwaysRun = true)
    public void tearDown(ITestResult result) {
        if (result.getStatus() == ITestResult.FAILURE) {
            log.error("TEST FAILED: {}", result.getName());
        }
        DriverManager.quit();
    }

    protected WebDriver getDriver() {
        return DriverManager.getDriver();
    }

    protected TestConfig config() {
        return TestConfig.getInstance();
    }
}
