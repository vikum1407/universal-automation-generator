describe('Home page', () => {

  beforeEach(() => {
    cy.visit('/');
  });

  it('should load successfully', () => {
    cy.title().should('not.be.empty');
  });

  it('should have visible body content', () => {
    cy.get('body').should('be.visible');
  });

});
