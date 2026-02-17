package generated.selenium;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.Test;

public class GeneratedTest {

    @Test
    public void testApi() {
        WebDriver driver = new ChromeDriver();

        // API Metadata
        String url = "${metadata.url}";
        String method = "${metadata.method}";

        System.out.println("Testing API: " + url);
        System.out.println("Method: " + method);

        driver.quit();
    }
}
