package generated.selenium;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.testng.annotations.Test;

import java.util.Map;

public class GeneratedTest {

    @Test
    public void testApi() {

        String url = "${metadata.url}";
        String method = "${metadata.method}";

        Map<String, String> headers = ${headers?json_string};
        Map<String, String> queryParams = ${queryParams?json_string};
        String requestBody = ${requestJson?json_string};

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
