export interface FieldInfo {
  name:      string;
  type:      string;   // text | email | password | number | select | checkbox | radio | textarea | hidden | file
  label:     string;
  required:  boolean;
  options?:  string[]; // for select/radio
  minLength?: number;
  maxLength?: number;
}

export interface FormInfo {
  id:        string;
  action:    string;
  method:    'GET' | 'POST' | string;
  purpose:   string;     // login | register | search | contact | generic
  fields:    FieldInfo[];
  isInModal?: boolean;   // true when the form is inside a dialog/modal overlay
}

export interface ButtonInfo {
  text: string;
  type: string; // submit | button | link
  role: string; // submit | nav | action | cta
}

export interface NavLink {
  text:       string;
  href:       string;
  isInternal: boolean;
  path:       string;
}

export interface PageInfo {
  url:             string;
  path:            string;
  title:           string;
  className:       string; // PascalCase class name derived from path
  forms:           FormInfo[];
  buttons:         ButtonInfo[];
  navLinks:        NavLink[];
  headings:        string[];
  isAuthProtected: boolean;
  hasTable:        boolean;
  hasModal:        boolean;
}

export interface PageMap {
  baseUrl:  string;
  pages:    PageInfo[];
  crawledAt: string;
}
