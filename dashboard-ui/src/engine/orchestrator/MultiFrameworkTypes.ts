export interface MultiFrameworkOutput {
  playwright: Record<string, string>;
  cypress: Record<string, string>;
  selenium: Record<string, string>;
  restassured: Record<string, string>;
}
