export const fetchAndProcessVideo = async (url: string): Promise<ArrayBuffer> => {
  try {
    const response = await fetch(url);
    if (!response.body) throw new Error('Failed to get response body');
    
    const reader = response.body.getReader();
    let chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
    }

    let totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
    let combined = new Uint8Array(totalLength);
    let position = 0;
    for (let chunk of chunks) {
      combined.set(chunk, position);
      position += chunk.length;
    }

    return combined.buffer;
  } catch (error) {
    console.error(`Error fetching and processing video from URL ${url}: ${error}`);
    throw error;
  }
}
