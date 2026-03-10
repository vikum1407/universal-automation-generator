import { UIScanNode } from './ui-selector-extractor';

export interface UIScanPage {
  url: string;
  title: string;
  html: string;
  selectors: UIScanNode[];
}

export interface UIScanResult {
  pages: UIScanPage[];
}
