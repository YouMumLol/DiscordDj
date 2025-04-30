import * as dotenv from "dotenv";
import { ElevenLabsClient } from "elevenlabs";

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error("Missing ELEVENLABS_API_KEY in environment variables");
}

const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

// vfaqCOvlrKi4Zp7C2IAm - demon
// qNkzaJoHLLdpvgh5tISm - king
// FeJtVBW106P4mvgGebAg - woman
// qZkuFcRFTdS6vkYu5ABx - deep lax
// ZEcx3Wdpj4EvM8PltzHY - robot
// RCQHZdatZm4oG3N6Nwme - lovejoy

export const createAudioStreamFromText = async (
  text: string
): Promise<Buffer> => {
  const audioStream = await client.textToSpeech.convertAsStream(
    ELEVENLABS_VOICE_ID,
    {
      model_id: "eleven_flash_v2_5",
      text,
      output_format: "mp3_44100_64",
      // Optional voice settings that allow you to customize the output
      voice_settings: {
        stability: 0,
        similarity_boost: 1.0,
        use_speaker_boost: true,
        speed: 1.0,
      },
    }
  );

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }

  const content = Buffer.concat(chunks);
  return content;
};
