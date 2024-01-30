import { createDataConnector } from "../../../DataConnector";

describe("YouTubeDataProvider", () => {
  it("should return transcription from youtube video", async () => {
    const urls = ["https://www.youtube.com/watch?v=jNQXAC9IVRw"];

    const youtubeDataConnector = createDataConnector({
      provider: "youtube",
    });

    await youtubeDataConnector.setOptions({ urls });

    const documents = await youtubeDataConnector.getDocuments();
    expect(documents).not.toBe(null);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0].content).not.toBe(null);
    expect(documents[0].content.length).toBeGreaterThan(0);
    expect(documents[0].content.toLowerCase()).toContain(
      "all right, so here we are, in front of the"
    );
    expect(documents[0].content.toLowerCase()).toContain("elephants");
    expect(documents[0].content.toLowerCase()).toContain(
      "the cool thing about these guys is that they"
    );
    expect(documents[0].content.toLowerCase()).toContain("have really...");
    expect(documents[0].content.toLowerCase()).toContain(
      "really really long trunks"
    );
    expect(documents[0].content.toLowerCase()).toContain("and that's cool");
    expect(documents[0].content.toLowerCase()).toContain("(baaaaaaaaaaahhh!!)");
    expect(documents[0].content.toLowerCase()).toContain(
      "and that's pretty much all there is to"
    );
    expect(documents[0].content.toLowerCase()).toContain("say");
  });

  it(
    "should return transcription from multiple youtube videos from a specific channel",
    async () => {
      const urls = ["https://www.youtube.com/@sideguide1530"];

      const youtubeDataConnector = createDataConnector({
        provider: "youtube",
      });

      await youtubeDataConnector.setOptions({ urls, isChannel: true });

      const documents = await youtubeDataConnector.getDocuments();
      expect(documents).not.toBe(null);
      expect(documents.length).toBeGreaterThan(0);
      expect(documents[0].content).not.toBe(null);
      expect(documents[0].content.length).toBeGreaterThan(0);

      expect(documents).toContainEqual({
        content: expect.stringContaining(
          "hi everybody my name is eric and i'm one"
        ),
        metadata: {
          sourceURL: "https://www.youtube.com/watch?v=DagdM1jPlpo",
        },
        provider: "youtube",
        type: "text",
      });
      expect(documents).toContainEqual({
        content: expect.stringContaining(
          "stop watching youtube tutorials to learn"
        ),
        metadata: {
          sourceURL: "https://www.youtube.com/watch?v=LlHyUuJ7fN4",
        },
        provider: "youtube",
        type: "text",
      });
    },
    10 * 1000
  ); // 10 seconds
});
