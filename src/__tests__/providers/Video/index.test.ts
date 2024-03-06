import { createDataConnector } from "../../../DataConnector";

jest.setTimeout(30000);

describe("VideoDataProvider", () => {
  it("should return correct documents", async () => {
    const videoDataConnector = createDataConnector({ provider: "video" });
    const optionsURLs = {
      urls: [
        "https://storage.mendable.ai/Rafa%20Copil_649259965/318247278_conversation_sample_1080p__mp4__1080p_.mp4",
        "https://storage.mendable.ai/Rafa%20Copil_592375078/449543075_pedro1.mp4"
      ]
    }

    await videoDataConnector.setOptions(optionsURLs);

    const documents = await videoDataConnector.getDocuments();
    expect(documents).not.toBe(null);
    expect(documents.length).toBe(2);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents[0].content).toMatch(
      /Miss Green, I am afraid your case just got a lot more complicated than expected. So, does this mean I will not get the loan\? I thought you (are|were) the most qualified advisor. I didn't say that. I will do my best to obtain a loan for you, but it might take a little longer./
    );
    expect(documents[0].metadata).toEqual({ sourceURL: optionsURLs.urls[0] });
    expect(documents[0].provider).toBe("video");
    expect(documents[0].type).toBe("video");
  }, 60 * 1000 /* 60 seconds */);
});
