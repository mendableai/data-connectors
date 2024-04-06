import { createDataConnector } from "./DataConnector";

async function test(){
    // const a = await createDataConnector({provider: 'web-scraper'});
    // await a.setOptions({mode: 'single_urls', urls:['https://cablenet.com.cy/en/mobile/purple-max-mobile/']});
    // a.getDocuments().then((res) => {
    //     console.log(res);
    // });
    const zendeskDataConnector = createDataConnector({
        provider: "zendesk",
      });
  
      await zendeskDataConnector.setOptions({
        zendesk_brand_name: "harrisupport",
      });
  
      const documents = await zendeskDataConnector.getDocuments(); // { type: "accounts" }
      console.log("documents", documents.length);

      documents.map((document) => {
        console.log("document", document);
      });
      // expect(documents).not.toBe(null);
      // expect(documents.length).toBeGreaterThan(0);
      // expect(documents[0].content).not.toBe(null);
      // expect(documents[0].content.length).toBeGreaterThan(0);
      // expect(documents[0].type).toBe("article");
      // expect(documents[0].provider).toBe("zendesk");
      // expect(documents[0].metadata).not.toBe(null);
      // expect(documents[0].metadata.sourceURL).not.toBe(null);
      // expect(documents[0].metadata.language).not.toBe(null);

}

// 
test();
