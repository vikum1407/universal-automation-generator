package {{BASE_PACKAGE}}.listeners;

import io.qameta.allure.Attachment;
import io.qameta.allure.listener.TestLifecycleListener;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

import {{BASE_PACKAGE}}.base.DriverManager;

public class AllureListener implements ITestListener {

    @Override
    public void onTestFailure(ITestResult result) {
        takeScreenshot("failure_" + result.getName());
    }

    @Override
    public void onTestStart(ITestResult result) {}

    @Override
    public void onTestSuccess(ITestResult result) {}

    @Override
    public void onTestSkipped(ITestResult result) {}

    @Override
    public void onFinish(ITestContext context) {}

    @Override
    public void onStart(ITestContext context) {}

    @Attachment(value = "{screenshotName}", type = "image/png")
    private byte[] takeScreenshot(String screenshotName) {
        try {
            return ((TakesScreenshot) DriverManager.getDriver())
                    .getScreenshotAs(OutputType.BYTES);
        } catch (Exception e) {
            return new byte[0];
        }
    }
}
