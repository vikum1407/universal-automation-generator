import { v4 as uuid } from 'uuid';
import { UiHtmlParser } from './ui-html-parser';
import { ActionModel } from '../metadata/action.model';
import { PageModel } from '../metadata/page.model';
import { IngestedData } from '../metadata/ingested-data.model';

export class UiUrlIngestor {
  private parser = new UiHtmlParser();

  async ingest(url: string): Promise<IngestedData> {
    const html = await this.parser.fetchHtml(url);
    const $ = this.parser.loadDom(html);

    const actions: ActionModel[] = [];

    $('button, a, input, select').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const id = $(el).attr('id');
      const classes = $(el).attr('class');
      const text = $(el).text().trim();

      const selectorParts: string[] = [];
      if (id) selectorParts.push(`#${id}`);
      if (classes) {
        const cls = classes
          .split(' ')
          .filter(Boolean)
          .map(c => `.${c}`)
          .join('');
        if (cls) selectorParts.push(cls);
      }

      const selector = selectorParts.length ? selectorParts.join('') : tag;

      const action: ActionModel = {
        id: uuid(),
        type:
          tag === 'input' || tag === 'select'
            ? 'input'
            : tag === 'a'
            ? 'navigate'
            : 'click',
        selector,
        description: text || `${tag} action`,
        pageName: 'Page'
      };

      actions.push(action);
    });

    const page: PageModel = {
      name: 'Page',
      url,
      actions
    };

    return {
      pages: [page],
      actions,
      metadata: {
        source: 'url',
        url,
        timestamp: Date.now()
      }
    };
  }
}
