describe(${metadata.testName}', () => {

  it('should execute API request', () => {

    cy.request({
      method: "${metadata.method}",
      url: "${metadata.url}",
      headers: ${headers?json_string},
      qs: ${queryParams?json_string},
      body: ${requestJson?json_string}
    }).then((response) => {
      expect(response.status).to.eq(${expectedStatus});
      cy.log("Response Body:", response.body);
    });

  });

});
