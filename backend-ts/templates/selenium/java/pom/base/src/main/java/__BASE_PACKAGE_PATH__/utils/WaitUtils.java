package {{BASE_PACKAGE}}.utils;

import {{BASE_PACKAGE}}.base.DriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.FluentWait;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.NoSuchElementException;

public final class WaitUtils {

    private WaitUtils() {}

    public static WebElement waitForVisible(By locator) {
        return defaultWait().until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        return defaultWait().until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static boolean waitForInvisible(By locator) {
        return defaultWait().until(ExpectedConditions.invisibilityOfElementLocated(locator));
    }

    public static WebElement fluentWait(By locator, int timeoutSec, int pollMs) {
        return new FluentWait<>(driver())
            .withTimeout(Duration.ofSeconds(timeoutSec))
            .pollingEvery(Duration.ofMillis(pollMs))
            .ignoring(NoSuchElementException.class)
            .until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    private static WebDriverWait defaultWait() {
        return new WebDriverWait(driver(), Duration.ofSeconds(30));
    }

    private static WebDriver driver() {
        return DriverManager.getDriver();
    }
}
