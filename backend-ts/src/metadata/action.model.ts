export type ActionType =
  | 'click'
  | 'input'
  | 'select'
  | 'navigate'
  | 'submit'
  | 'checkbox'
  | 'radio';

export interface ActionModel {
  id: string;
  type: ActionType;
  selector: string;
  pageName?: string;
  description?: string;
  valueExample?: string;
}
