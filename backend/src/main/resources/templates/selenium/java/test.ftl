import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.testng.annotations.Test;
import java.util.HashMap;
import java.util.Map;

public class GeneratedTest {

    @Test
    public void testApi() {

        String url = "${metadata.url}";
        String method = "${metadata.method}";

        Map<String, String> headers = new HashMap<>();
        <#if headers??>
            <#list headers?keys as key>
                headers.put("${key}", "${headers[key]}");
            </#list>
        </#if>

        Map<String, String> queryParams = new HashMap<>();
        <#if queryParams??>
            <#list queryParams?keys as key>
                queryParams.put("${key}", "${queryParams[key]}");
            </#list>
        </#if>

        String requestBody = """${requestJson}""";

        Response response = RestAssured
                .given()
                .headers(headers)
                .queryParams(queryParams)
                .body(requestBody)
                .when()
                .request(method, url);

        response.then().statusCode(${expectedStatus});

        System.out.println("Response Body: " + response.getBody().asString());
    }
}
