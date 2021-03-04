import { NextFunction, Request, Response } from 'express';
import Parser from 'rss-parser';
import urls from '../utils/urls';
import { obtainPreviewNews } from '../utils/obtainPreviews';

/*
  UtilsController - controller to parse the
  feed and get news, all with scraping and
  parsing RSS.
*/

type CustomFeed = {
  foo: string;
};
type CustomItem = {
  bar: number;
  itunes: { duration: string; image: string };
  'content:encoded': string;
  'content:encodedSnippet': string;
};

const parser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    feed: ['foo'],
    item: ['bar'],
  },
});

interface News {
  title?: string;
  url?: string;
  author?: string;
  thumbnail?: string;
  content?: string;
}

interface Podcast {
  title?: string;
  duration?: string;
  created?: Date | string;
  mp3?: string;
}

interface rssPage {
  url: string;
  author: string;
  content: string;
}

export default class UtilsController {
  async getAnitakume(req: Request, res: Response, next: NextFunction) {
    let feed: CustomFeed & Parser.Output<CustomItem>;

    try {
      feed = await parser.parseURL(urls.BASE_IVOOX);
    } catch (err) {
      return next(err);
    }

    const podcast: Podcast[] = [];
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    feed.items.forEach(item => {
      const date: Date = new Date(item.pubDate!);

      const formattedObject: Podcast = {
        title: item.title,
        duration: item.itunes.duration,
        created: `${date.getDate()} de ${
          monthNames[date.getMonth()]
        } de ${date.getFullYear()}`,
        mp3: item.enclosure?.url,
      };

      podcast.push(formattedObject);
    });

    if (podcast.length > 0) {
      res.status(200).json({ podcast });
    } else {
      res.status(500).json({ message: 'Aruppi lost in the shell' });
    }
  }

  async getNews(req: Request, res: Response, next: NextFunction) {
    const news: News[] = [];
    const pagesRss: rssPage[] = [
      { url: urls.BASE_KUDASAI, author: 'Kudasai', content: 'content_encoded' },
      {
        url: urls.BASE_PALOMITRON,
        author: 'Palomitron',
        content: 'description',
      },
      {
        url: urls.BASE_RAMENPARADOS,
        author: 'Ramen para dos',
        content: 'content',
      },
      {
        url: urls.BASE_CRUNCHYROLL,
        author: 'Crunchyroll',
        content: 'content_encoded',
      },
    ];

    try {
      for (const rssPage of pagesRss) {
        const feed = await parser.parseURL(rssPage.url);

        feed.items.forEach(item => {
          const formattedObject: News = {
            title: item.title,
            url: item.link,
            author: feed.title?.includes('Crunchyroll')
              ? 'Crunchyroll'
              : feed.title,
            thumbnail: obtainPreviewNews(item['content:encoded']),
            content: item['content:encodedSnippet'],
          };

          news.push(formattedObject);
        });
      }
    } catch (err) {
      return next(err);
    }

    res.json({ news });
  }
}