import { PassThrough, Readable } from "stream";

export function combineStreams(ttsStream: Readable, youtubeStream: Readable) {
  const combinedStream = new PassThrough();

  // Pipe the TTS stream into the combined stream without closing it
  ttsStream.pipe(combinedStream, { end: false });

  ttsStream.on("end", () => {
    console.log("TTS ended. Starting YouTube stream...");
    youtubeStream.pipe(combinedStream); // Now pipe YouTube stream after TTS ends
  });

  ttsStream.on("error", (err) => {
    console.error("TTS Stream error:", err);
    combinedStream.destroy(err); // Destroy if there's an error with TTS
  });

  youtubeStream.on("error", (err) => {
    console.error("YouTube Stream error:", err);
    combinedStream.destroy(err); // Destroy if there's an error with YouTube
  });

  youtubeStream.on("close", () => {
    console.log("YouTube stream ended.");
    combinedStream.end(); // End the combined stream once YouTube is done
  });

  return combinedStream;
}
