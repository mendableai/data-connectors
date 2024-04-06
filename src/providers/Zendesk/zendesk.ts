import axios from "axios";
import { parse } from "node-html-parser";

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
    const response = await axios.get(url, {
      headers: {
        Cookie: `ajs_anonymous_id=5ababdb1-b849-42c5-b241-8f8a3f0f62f3; optimizelyEndUserId=oeu1708709997187r0.09247733792573842; _gcl_au=1.1.1298811565.1708709998; _fbp=fb.1.1708709998654.1752553910; _biz_uid=94946e7ae24d4f06d35187d3d58a8f36; _biz_flagsA=%7B%22Version%22%3A1%2C%22ViewThrough%22%3A%221%22%2C%22XDomain%22%3A%221%22%7D; mendable.zendesk.com_closed_hc_alert=true; ajs_user_id=23236295816339; ajs_group_id=19216588; _pendo_visitorId.df3d609f-14a9-4a77-b441-73602a4aaab2=23236295816339; _pendo_accountId.df3d609f-14a9-4a77-b441-73602a4aaab2=19216588; _pendo___sg__.df3d609f-14a9-4a77-b441-73602a4aaab2=%7B%22visitormetadata%22%3A%7B%22agent__support_user_role%22%3A%22Admin%22%7D%7D; whats-new-q1-2024=true; lead-funnel-stage=live-customer; _hjSessionUser_1694280=eyJpZCI6Ijg0YTlmMDk4LWQ3ZTYtNWFiNS1hN2Y0LWIxYmNmN2ZkOWQ3NiIsImNyZWF0ZWQiOjE3MTExMjIxOTE1MzgsImV4aXN0aW5nIjp0cnVlfQ==; OptanonAlertBoxClosed=2024-03-28T18:14:09.022Z; __cfruid=ef8f70e0c423291bf444f9a33f6bd98726bd14f6-1712100489; _gid=GA1.2.1964742500.1712100491; cf_clearance=je4tugl2WOq4inaw7MaX1TQXkul_ghyKgaRcyRMQSD8-1712100491-1.0.1.1-qmAEaeuUrKQIS0dANLSQ2BqRwSSShKD_WhMORBiC04ov5eyt8wD.dKhvkO65z_DX3SK9E_QkC4vBQ4bSbm_TkA; _zendesk_authenticated=1; _zendesk_cookie=BAhJIkx7ImRldmljZV90b2tlbnMiOnsiMjQ0NDA2MjUzMDg1NzEiOiJ4WkhNV3I4Yk5uemxzZTJmNGhXMGhVdDdIdjUzT1RPeSJ9fQY6BkVU--a18f5db11fef2608c19246a9d286ba7bcd90cc27; _pendo_meta.df3d609f-14a9-4a77-b441-73602a4aaab2=2662388751; _pendo_guides_blocked.df3d609f-14a9-4a77-b441-73602a4aaab2=0; flight=%7B%22first_touch_timestamp%22%3A1708709997472%2C%22last_touch_timestamp%22%3A1712101207940%2C%22first_referrer%22%3A%22%22%2C%22last_referrer%22%3A%22%22%2C%22first_landing_page%22%3A%22https%3A%2F%2Fwww.zendesk.com%2F%22%2C%22last_landing_page%22%3A%22https%3A%2F%2Fwww.zendesk.com%2Fapi%2Fv2%2Fusers%2Fme%2Fsession%2Frenew%2F%22%2C%22time_on_site%22%3A0%2C%22total_time_on_site%22%3A359%2C%22page_views%22%3A32%2C%22visits%22%3A13%2C%22trials%22%3A0%2C%22domain%22%3A%22none%22%2C%22seenOffer%22%3A%22ProactiveChat%22%2C%22seenOfferVersion%22%3A%221.0.4%22%7D; _ga_FBP7C61M6Z=GS1.1.1712101208.15.0.1712101208.60.0.0; _uetsid=5722aff0f14a11eebbd63394e45302af; _uetvid=9066ab50d27211eeab6fd92e70ec2b54; _hjSession_1694280=eyJpZCI6IjdjZDdjNWJjLWE0YzctNGViOC1iZmY4LTZjNzkxMTY4YzQ3OCIsImMiOjE3MTIxMDEyMDg3ODgsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MH0=; _biz_nA=32; _biz_pendingA=%5B%5D; OptanonConsent=isGpcEnabled=0&datestamp=Tue+Apr+02+2024+20%3A41%3A00+GMT-0300+(Brasilia+Standard+Time)&version=202402.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&genVendors=V1%3A0%2C&consentId=f0e563cc-b0af-4d2f-b9e0-c3b2520428b1&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0003%3A1%2CC0002%3A1%2CC0004%3A1&AwaitingReconsent=false; _ga_GX4ZE3WYYT=GS1.1.1712101216.7.1.1712101282.0.0.0; _ga_0G6FC9CS2V=GS1.1.1712101216.2.1.1712101282.60.0.0; _ga_RT22B72TL2=GS1.1.1712100903.7.1.1712101367.2.0.0; _zendesk_shared_session=-aXdWK2FHMTMrUjR1bldKaVdXM3lrTXdUZWRnNmdWanNVOWxTYnYvelFCMWlzQm8zeGlzRGlxRzArNHBuS21nSzQ4ZnpGNjlJRWZIelpSVXhJakpLTzJ3eTZiRmV4cEh3eExRNFpWS0M3WFJLZFlFcVB1Tyt4YitoWXYxdHBIZDMtLTV6U0JIejkxN3YvVGJjMTZRRjI5MFE9PQ%3D%3D--5d6f6af7ae6ec0f50a554a76e5b9d984e56cfafc; _help_center_session=d2NzZnZ5cUx0MFJZTmUxOGhCNmJnSmNDbG55SEhSdTFJcHNVUkQ0VWZPbW1selo5MVZDdklGbGQxTnYwclF3YndFV2ExL0NuaTdEZ1FvWml4UUF6OUVpS1hUcndjYkZYWlA4SFN3a29aQjN6Y2lyWFNqVWtIcm9maC9FcEk2UDVoK09jV3FCN05wVmNsTFVEcjh0N3ROUFM5TEd5NnB4TlNzRkpNMWV5ZktUamlZQnh0Uk5FRkY3dGErN3pxS1M5NVducFdPWDlJdzl4RjdzOENkZjNEdz09LS1jejdhVmp4SjB1WHo2VENJbnBkbFd3PT0%3D--0374900e7c84589b27d69ebb50bee75b12ba6035; _gat=1; _ga=GA1.1.1355762577.1708621130; _zendesk_session=TQ3ILccfKMf%2BArTK%2B1tEb9L%2F4OipgQntNlW0Q%2FCpnorH%2BthxNUGB4Yunlcnb2myoyHgJRCDlTRcOk%2FxGCVWsaxL%2F7cGIOZkkGc9dPGZLHaZSeNVoshwMyMRtP8%2BSsa4CXsESMi%2FURndSUlwL2VWN%2BYThUbVdoAnNtxTVyZqdoCR2euxOBw6ovE7Yj%2FmWJNP346AjB5Zg78O3wYp5M5c0J%2BRDcXlZ8G858PKFdBakPCrazNo84B8DaLj9nDrUzZMdXmxW98iiCgPuQKhaSyUIW3tUJD1%2FUpuINwxS3erjI%2F6oJpW617QjVNCHUflSyuYTd23YC2yO%2Fn41Dq7qal32aI4pW9OwdJDmSx1dFEd7PolyEa3x1RCgVFoUKSdSzJoopWUz939oDdnPSh0qn91HFWr41uuhk2IH--0pyNqps8kj4ATWDw--5quBozLdkcw0slwCu2t9KQ%3D%3D; _ga_8FQFR5T73R=GS1.1.1712100647.1.1.1712101890.0.0.0`,
      },
    });
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
        let bodyText = article.body;
        try {
        bodyText = parse(article.body).text ?? article.body;
        } catch (error) {
          bodyText = article.body;
          
        }
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
    let articles: ZendeskArticle[] = [];
    let next_page: string | null = null;

    const firstPage = await this.getArticlesPage({ locale, next_page: null });
    next_page = firstPage.next_page;
    articles = articles.concat(firstPage.articles);

    while (next_page != null) {
      const page = await this.getArticlesPage({ locale, next_page });
      articles = articles.concat(page.articles);
      next_page = page.next_page;
    }

    return articles;
  }

  private async getArticlesPage(options: {
    locale: string;
    next_page: string | null;
  }): Promise<{ articles: ZendeskArticle[]; next_page: string | null }> {
    const { locale, next_page } = options;

    let url: string;
    if (next_page == null) {
      url = `https://${this.zendesk_subdomain}.zendesk.com/api/v2/help_center/${locale}/articles?page[size]=100`;
    } else {
      url = next_page;
    }

    const response = await axios.get(url, {
      headers: {
        Cookie: `ajs_anonymous_id=5ababdb1-b849-42c5-b241-8f8a3f0f62f3; optimizelyEndUserId=oeu1708709997187r0.09247733792573842; _gcl_au=1.1.1298811565.1708709998; _fbp=fb.1.1708709998654.1752553910; _biz_uid=94946e7ae24d4f06d35187d3d58a8f36; _biz_flagsA=%7B%22Version%22%3A1%2C%22ViewThrough%22%3A%221%22%2C%22XDomain%22%3A%221%22%7D; mendable.zendesk.com_closed_hc_alert=true; ajs_user_id=23236295816339; ajs_group_id=19216588; _pendo_visitorId.df3d609f-14a9-4a77-b441-73602a4aaab2=23236295816339; _pendo_accountId.df3d609f-14a9-4a77-b441-73602a4aaab2=19216588; _pendo___sg__.df3d609f-14a9-4a77-b441-73602a4aaab2=%7B%22visitormetadata%22%3A%7B%22agent__support_user_role%22%3A%22Admin%22%7D%7D; whats-new-q1-2024=true; lead-funnel-stage=live-customer; _hjSessionUser_1694280=eyJpZCI6Ijg0YTlmMDk4LWQ3ZTYtNWFiNS1hN2Y0LWIxYmNmN2ZkOWQ3NiIsImNyZWF0ZWQiOjE3MTExMjIxOTE1MzgsImV4aXN0aW5nIjp0cnVlfQ==; OptanonAlertBoxClosed=2024-03-28T18:14:09.022Z; __cfruid=ef8f70e0c423291bf444f9a33f6bd98726bd14f6-1712100489; _gid=GA1.2.1964742500.1712100491; cf_clearance=je4tugl2WOq4inaw7MaX1TQXkul_ghyKgaRcyRMQSD8-1712100491-1.0.1.1-qmAEaeuUrKQIS0dANLSQ2BqRwSSShKD_WhMORBiC04ov5eyt8wD.dKhvkO65z_DX3SK9E_QkC4vBQ4bSbm_TkA; _zendesk_authenticated=1; _zendesk_cookie=BAhJIkx7ImRldmljZV90b2tlbnMiOnsiMjQ0NDA2MjUzMDg1NzEiOiJ4WkhNV3I4Yk5uemxzZTJmNGhXMGhVdDdIdjUzT1RPeSJ9fQY6BkVU--a18f5db11fef2608c19246a9d286ba7bcd90cc27; _pendo_meta.df3d609f-14a9-4a77-b441-73602a4aaab2=2662388751; _pendo_guides_blocked.df3d609f-14a9-4a77-b441-73602a4aaab2=0; flight=%7B%22first_touch_timestamp%22%3A1708709997472%2C%22last_touch_timestamp%22%3A1712101207940%2C%22first_referrer%22%3A%22%22%2C%22last_referrer%22%3A%22%22%2C%22first_landing_page%22%3A%22https%3A%2F%2Fwww.zendesk.com%2F%22%2C%22last_landing_page%22%3A%22https%3A%2F%2Fwww.zendesk.com%2Fapi%2Fv2%2Fusers%2Fme%2Fsession%2Frenew%2F%22%2C%22time_on_site%22%3A0%2C%22total_time_on_site%22%3A359%2C%22page_views%22%3A32%2C%22visits%22%3A13%2C%22trials%22%3A0%2C%22domain%22%3A%22none%22%2C%22seenOffer%22%3A%22ProactiveChat%22%2C%22seenOfferVersion%22%3A%221.0.4%22%7D; _ga_FBP7C61M6Z=GS1.1.1712101208.15.0.1712101208.60.0.0; _uetsid=5722aff0f14a11eebbd63394e45302af; _uetvid=9066ab50d27211eeab6fd92e70ec2b54; _hjSession_1694280=eyJpZCI6IjdjZDdjNWJjLWE0YzctNGViOC1iZmY4LTZjNzkxMTY4YzQ3OCIsImMiOjE3MTIxMDEyMDg3ODgsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MH0=; _biz_nA=32; _biz_pendingA=%5B%5D; OptanonConsent=isGpcEnabled=0&datestamp=Tue+Apr+02+2024+20%3A41%3A00+GMT-0300+(Brasilia+Standard+Time)&version=202402.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&genVendors=V1%3A0%2C&consentId=f0e563cc-b0af-4d2f-b9e0-c3b2520428b1&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0003%3A1%2CC0002%3A1%2CC0004%3A1&AwaitingReconsent=false; _ga_GX4ZE3WYYT=GS1.1.1712101216.7.1.1712101282.0.0.0; _ga_0G6FC9CS2V=GS1.1.1712101216.2.1.1712101282.60.0.0; _ga_RT22B72TL2=GS1.1.1712100903.7.1.1712101367.2.0.0; _zendesk_shared_session=-aXdWK2FHMTMrUjR1bldKaVdXM3lrTXdUZWRnNmdWanNVOWxTYnYvelFCMWlzQm8zeGlzRGlxRzArNHBuS21nSzQ4ZnpGNjlJRWZIelpSVXhJakpLTzJ3eTZiRmV4cEh3eExRNFpWS0M3WFJLZFlFcVB1Tyt4YitoWXYxdHBIZDMtLTV6U0JIejkxN3YvVGJjMTZRRjI5MFE9PQ%3D%3D--5d6f6af7ae6ec0f50a554a76e5b9d984e56cfafc; _help_center_session=d2NzZnZ5cUx0MFJZTmUxOGhCNmJnSmNDbG55SEhSdTFJcHNVUkQ0VWZPbW1selo5MVZDdklGbGQxTnYwclF3YndFV2ExL0NuaTdEZ1FvWml4UUF6OUVpS1hUcndjYkZYWlA4SFN3a29aQjN6Y2lyWFNqVWtIcm9maC9FcEk2UDVoK09jV3FCN05wVmNsTFVEcjh0N3ROUFM5TEd5NnB4TlNzRkpNMWV5ZktUamlZQnh0Uk5FRkY3dGErN3pxS1M5NVducFdPWDlJdzl4RjdzOENkZjNEdz09LS1jejdhVmp4SjB1WHo2VENJbnBkbFd3PT0%3D--0374900e7c84589b27d69ebb50bee75b12ba6035; _gat=1; _ga=GA1.1.1355762577.1708621130; _zendesk_session=TQ3ILccfKMf%2BArTK%2B1tEb9L%2F4OipgQntNlW0Q%2FCpnorH%2BthxNUGB4Yunlcnb2myoyHgJRCDlTRcOk%2FxGCVWsaxL%2F7cGIOZkkGc9dPGZLHaZSeNVoshwMyMRtP8%2BSsa4CXsESMi%2FURndSUlwL2VWN%2BYThUbVdoAnNtxTVyZqdoCR2euxOBw6ovE7Yj%2FmWJNP346AjB5Zg78O3wYp5M5c0J%2BRDcXlZ8G858PKFdBakPCrazNo84B8DaLj9nDrUzZMdXmxW98iiCgPuQKhaSyUIW3tUJD1%2FUpuINwxS3erjI%2F6oJpW617QjVNCHUflSyuYTd23YC2yO%2Fn41Dq7qal32aI4pW9OwdJDmSx1dFEd7PolyEa3x1RCgVFoUKSdSzJoopWUz939oDdnPSh0qn91HFWr41uuhk2IH--0pyNqps8kj4ATWDw--5quBozLdkcw0slwCu2t9KQ%3D%3D; _ga_8FQFR5T73R=GS1.1.1712100647.1.1.1712101890.0.0.0`,
      },
    });
    const articlesPage = {
      articles: response.data.articles,
      next_page: response.data.links.next,
    };

    return articlesPage;
  }
}




// email:password -> base64 -> Basic

