import ytdl from "@distube/ytdl-core";
import { createAudioStreamFromText } from "AI/tts.js";
import youtubesearchapi from "youtube-search-api";
// TypeScript: import ytdl from '@distube/ytdl-core'; with --esModuleInterop
// TypeScript: import * as ytdl from '@distube/ytdl-core'; with --allowSyntheticDefaultImports
// TypeScript: import ytdl = require('@distube/ytdl-core'); with neither of the above

const url = "https://www.youtube.com/watch?v=bg8vTSyHFkQ";
const prefix = "https://www.youtube.com/watch?v=";

export const youtubeStream = (videoId: string) => {
  try {
    console.log("Attempting ytdl stream for", prefix + videoId);
    const stream = ytdl(prefix + videoId, {
      filter: "audioonly",
      quality: "lowestaudio",
    });
    return stream;
  } catch (e) {
    return createAudioStreamFromText(
      "Sorry we got an error trying to play song: " + e
    );
  }
};

export const youtubeSearch = async (title: string, limit = 5) => {
  try {
    console.log("Searching for:", title);
    const listByKeywords = await youtubesearchapi.GetListByKeyword(
      title,
      false,
      limit,
      [{ type: "video" }]
    );
    console.log("listByKeywords:", listByKeywords);
    return listByKeywords;
  } catch (e) {
    console.error("ERROR DURING SEARCH", e);
  }
};
