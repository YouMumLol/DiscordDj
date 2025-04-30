import { config } from "dotenv";
import Groq from "groq-sdk";

// Load environment variables from .env file
config();

// Initialize Groq with API key from environment
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface SongRecommendation {
  nextSong: string;
  djCommentary: string;
  genre: string;
  reason: string;
}

export async function getNextSong(
  currentSong: string
): Promise<SongRecommendation> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: `You are a knowledgeable DJ with a deep understanding of music genres, artists, and how songs flow together. 
        Your task is to recommend the next song to play based on the current song, considering:
        - Musical flow and energy
        - Genre compatibility
        - Artist relationships
        - Fan preferences
        - Time period appropriateness
        
        Respond in JSON format with the following structure:
        {
          "nextSong": "Song Title - Artist",
          "djCommentary": "A brief, engaging announcement like a radio host would make, can mention the past song or the upcoming one",
        }`,
      },
      {
        role: "user",
        content: `The current song playing is "${currentSong}". What should we play next?`,
      },
    ],
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error("No response from Groq");
  }

  try {
    return JSON.parse(response) as SongRecommendation;
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    throw new Error("Invalid response format from Groq");
  }
}

export async function getDJCommentary(songTitle: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content: `You are a charismatic and entertaining radio DJ.
Your job is to introduce a song in a brief, engaging way — like a short radio announcement fill, hopefully max 20 words long and min 3 words.
You can: 
- Reference the song title or artist
- Set a mood
- Add flair or context (e.g., "a fan favorite", "one to headbang to", "a deep cut")

Your output should ONLY be a single short string of text, not JSON, not code.`,
      },
      {
        role: "user",
        content: `Give me a DJ-style commentary for the song "${songTitle}".`,
      },
    ],
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error("No DJ commentary response from Groq");
  }

  return response.trim();
}
