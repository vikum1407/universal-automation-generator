package {{BASE_PACKAGE}}.tests;

import {{BASE_PACKAGE}}.base.BaseTest;
import org.testng.Assert;
import org.testng.annotations.Test;

public class SampleTest extends BaseTest {

    @Test(description = "Verify home page loads successfully")
    public void homePageLoads() {
        getDriver().get(config().getBaseUrl());
        String title = getDriver().getTitle();
        Assert.assertFalse(title.isEmpty(), "Page title should not be empty");
        log.info("Home page title: {}", title);
    }

    @Test(description = "Verify page title contains expected text", dependsOnMethods = "homePageLoads")
    public void pageTitleNotEmpty() {
        getDriver().get(config().getBaseUrl());
        Assert.assertNotNull(getDriver().getTitle());
    }
}
