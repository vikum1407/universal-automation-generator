export class TestIdGenerator {
  private uiCounter = 1;
  private apiCounter = 1;

  nextUI() {
    return `UI-TC-${String(this.uiCounter++).padStart(3, '0')}`;
  }

  nextAPI() {
    return `API-TC-${String(this.apiCounter++).padStart(3, '0')}`;
  }
}
