import { createDataConnector } from "./DataConnector";

async function test2(){

    const a = createDataConnector({
        provider: 'web-scraper',
        
    })

    await a.setOptions({
        mode: 'single_urls',
        urls: ['https://mendable.ai'],
    });

    const res = await a.getDocuments();
    console.log(res);
    
}

test2();

