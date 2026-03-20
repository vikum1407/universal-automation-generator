export type FlowCaptureEvent =
  | NavigationEvent
  | ActionEvent
  | DomSnapshotEvent
  | AssertionEvent
  | ErrorEvent;

export interface NavigationEvent {
  type: "navigation";
  url: string;
  timestamp: number;
}

export interface ActionEvent {
  type: "action";
  action: "click" | "type" | "select" | "check" | "uncheck";
  selector: string;
  value?: string;
  timestamp: number;
}

export interface DomSnapshotEvent {
  type: "dom-snapshot";
  selector: string;
  html: string;
  attributes: Record<string, string>;
  text: string;
  timestamp: number;
}

export interface AssertionEvent {
  type: "assertion";
  selector: string;
  assertion: string;
  expected: string;
  timestamp: number;
}

export interface ErrorEvent {
  type: "error";
  message: string;
  selector?: string;
  timestamp: number;
}
