describe('Generated API Test', () => {

  it('should test API metadata', () => {

    const url: string = "${metadata.url}";
    const method: string = "${metadata.method}";

    cy.log("Testing API: " + url);
    cy.log("Method: " + method);

  });

});
