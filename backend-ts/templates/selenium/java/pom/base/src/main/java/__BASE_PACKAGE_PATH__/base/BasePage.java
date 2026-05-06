package {{BASE_PACKAGE}}.base;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

public abstract class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;
    protected final Logger log = LoggerFactory.getLogger(getClass());

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait   = new WebDriverWait(driver, Duration.ofSeconds({{TIMEOUT}} / 1000));
    }

    protected WebElement find(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected void click(By locator) {
        find(locator).click();
    }

    protected void type(By locator, String text) {
        WebElement el = find(locator);
        el.clear();
        el.sendKeys(text);
    }

    protected String getText(By locator) {
        return find(locator).getText();
    }

    protected boolean isVisible(By locator) {
        try { return find(locator).isDisplayed(); }
        catch (Exception e) { return false; }
    }

    protected void scrollTo(By locator) {
        WebElement el = driver.findElement(locator);
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", el);
    }

    protected void navigateTo(String path) {
        driver.get("{{BASE_URL}}" + path);
    }

    public String getTitle() {
        return driver.getTitle();
    }
}
