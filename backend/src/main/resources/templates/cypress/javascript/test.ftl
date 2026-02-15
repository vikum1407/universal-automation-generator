describe('Generated API Test', () => {

  it('should test API metadata', () => {

    const url = "${metadata.url}";
    const method = "${metadata.method}";

    cy.log("Testing API: " + url);
    cy.log("Method: " + method);

  });

});
