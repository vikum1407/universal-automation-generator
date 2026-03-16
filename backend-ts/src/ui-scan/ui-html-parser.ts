import axios from 'axios';
import * as cheerio from 'cheerio';

export class UiHtmlParser {
  async fetchHtml(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Qlitz-UI-Scanner/1.0' }
    });
    return response.data;
  }

  loadDom(html: string) {
    return cheerio.load(html);
  }
}
