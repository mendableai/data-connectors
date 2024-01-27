import { createDataConnector } from "./DataConnector";
import dotenv from "dotenv";
dotenv.config();

async function a(){
const youtubeConnector = createDataConnector({
    provider: 'youtube',
  });

  await youtubeConnector.setOptions({
    mode:"video-urls",
    urls: ["https://www.youtube.com/watch?v=SAHdqHvI_ts"]
  });


  console.log(process.env.NANGO_CONNECTION_ID_TEST)
  await youtubeConnector.authorizeNango({
    nango_connection_id: process.env.NANGO_CONNECTION_ID_TEST ?? "",
  })

  const documents = await youtubeConnector.getDocuments();
}

a();