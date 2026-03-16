import { ActionModel } from './action.model';

export interface PageModel {
  name: string;
  url: string;
  actions: ActionModel[];
}
