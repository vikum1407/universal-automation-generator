import { ActionModel } from '../metadata/action.model';

export class UiActionDetector {
  refine(actions: ActionModel[]): ActionModel[] {
    return actions.map(a => {
      const selector = a.selector.toLowerCase();

      if (selector.includes('submit')) {
        return { ...a, type: 'submit' };
      }

      if (selector.includes('checkbox')) {
        return { ...a, type: 'checkbox' };
      }

      if (selector.includes('radio')) {
        return { ...a, type: 'radio' };
      }

      return a;
    });
  }
}
