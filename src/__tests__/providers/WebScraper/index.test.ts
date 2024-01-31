import { createDataConnector } from "../../../DataConnector";

test(
  "WebScraper Crawl test",
  async () => {
    // const webDataConnector = createDataConnector({
    //   provider: "web-scraper",
    // });
    // await webDataConnector.setOptions({
    //   urls: ["https://mendable.ai"],
    //   mode: "crawl",
    //   crawlerOptions:{
    //     returnOnlyUrls: false
    //   }
    // });
    // const documents = await webDataConnector.getDocuments(); // { type: "accounts" }
    // expect(documents).not.toBe(null);
    // expect(documents.length).toBeGreaterThan(11);
  },
  3 * 60 * 1000
);

test("WebScraper Sitemap model", async () => {
  // const webDataConnector = createDataConnector({
  //   provider: "web-scraper",
  // });
  // await webDataConnector.setOptions({
  //   urls: ["https://docs.mendable.ai/sitemap.xml"],
  //   mode: "sitemap",
  // });
  // const documents = await webDataConnector.getDocuments(); // { type: "accounts" }
  // expect(documents).not.toBe(null);
  // expect(documents.length).toBeGreaterThan(11);
}, 3 * 60 * 1000);

test(
  "WebScraper Single Urls mode",
  async () => {
    const webDataConnector = createDataConnector({
      provider: "web-scraper",
    });

    await webDataConnector.setOptions({
      urls: [
        "https://docs.mendable.ai/applications/routers",
        "https://docs.mendable.ai/integrations/slack",
      ],
      mode: "single_urls",
    });

    const documents = await webDataConnector.getDocuments(); // { type: "accounts" }
    expect(documents).not.toBe(null);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents[0].content).toContain("garrett@sideguide.dev");
    expect(documents[1].content).toContain("slack");
    expect(documents[1].content).not.toBe(null);
    expect(documents[1].provider).toBe("web-scraper");
    expect(documents[0].metadata.sourceURL).not.toBe(null);
    expect(documents[1].metadata.sourceURL).not.toBe(null);
  },
  3 * 60 * 1000
);

//   // timeout of 3minutes
// }, 3 * 60 * 1000);
