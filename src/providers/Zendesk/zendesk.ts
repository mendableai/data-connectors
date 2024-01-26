import axios from 'axios';
import { parse } from 'node-html-parser';

interface ZendeskDocument {
    text: string;
    extra_info: {
        id: number;
        title: string;
        url: string;
        updated_at: Date;
        locale: string;
    };
}

type ZendeskArticle = {
    author_id: number;
    comments_disabled: boolean;
    content_tag_ids: string[];
    id: number;
    locale: string;
    permission_group_id: number;
    position: number;
    promoted: boolean;
    title: string;
    user_segment_id: number;
};

export class ZendeskReader {
    private zendesk_subdomain: string;
    private locales: string[];

    constructor(zendesk_subdomain: string, locales: string[] = []) {
        this.zendesk_subdomain = zendesk_subdomain;
        this.locales = locales;
    }

    async getAvailableLocales(): Promise<string[]> {
        const url = `https://${this.zendesk_subdomain}.zendesk.com/api/v2/help_center/locales.json`;
        const response = await axios.get(url);
        const locales = response.data.locales as string[];
        return locales;
    }

    async loadData(): Promise<ZendeskDocument[]> {
        const results: ZendeskDocument[] = [];
        if (this.locales.length === 0) {
            this.locales = await this.getAvailableLocales();
        }

        for (const locale of this.locales) {
            const articles = await this.getAllArticles(locale);

            for (const article of articles) {
                if (article.body == null) continue;

                const bodyText = parse(article.body).text;
                results.push({
                    text: bodyText,
                    extra_info: {
                        id: article.id,
                        title: article.title,
                        url: article.html_url,
                        updated_at: new Date(article.updated_at),
                        locale: locale,
                    },
                });
            }
        }

        return results;
    }

    private async getAllArticles(locale: string): Promise<any[]> {
        let articles : ZendeskArticle[] = [];
        let next_page: string | null = null;

        const firstPage = await this.getArticlesPage({ locale, next_page: null });
        next_page = firstPage.next_page;

        while (next_page != null) {
            const page = await this.getArticlesPage({ locale, next_page });
            articles = articles.concat(page.articles);
            next_page = page.next_page;
        } 

        return articles;
    }

    private async getArticlesPage(options: { locale: string, next_page: string | null }): Promise<{ articles: ZendeskArticle[], next_page: string | null }> {
        const { locale, next_page } = options;

        let url: string;
        if (next_page == null) {
            url = `https://${this.zendesk_subdomain}.zendesk.com/api/v2/help_center/${locale}/articles?page[size]=100`;
        } else {
            url = next_page;
        }

        const response = await axios.get(url);
    
        const articlesPage = {
            articles: response.data.articles,
            next_page: response.data.links.next,
        }

        return articlesPage;
    }
}