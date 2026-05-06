export abstract class BasePage {
  protected readonly baseUrl = Cypress.config('baseUrl') ?? '';

  visit(path = '') {
    cy.visit(path);
    return this;
  }

  getTitle() {
    return cy.title();
  }

  protected find(selector: string) {
    return cy.get(selector);
  }

  protected click(selector: string) {
    cy.get(selector).click();
    return this;
  }

  protected type(selector: string, text: string) {
    cy.get(selector).clear().type(text);
    return this;
  }

  protected assertVisible(selector: string) {
    cy.get(selector).should('be.visible');
    return this;
  }

  protected assertText(selector: string, expected: string) {
    cy.get(selector).should('have.text', expected);
    return this;
  }

  protected waitForNetworkIdle() {
    cy.intercept('**').as('anyRequest');
    cy.wait('@anyRequest');
    return this;
  }
}
