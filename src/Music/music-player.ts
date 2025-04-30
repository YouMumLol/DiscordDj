import {
  AudioPlayer,
  createAudioPlayer,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  createAudioResource,
} from "@discordjs/voice";
import { createAudioStreamFromText } from "../AI/tts.js";
import { getNextSong, getDJCommentary } from "../AI/dj-functions.js";
import { youtubeStream, youtubeSearch } from "yt-functions.js";
import { randomInt } from "crypto";
import { TextBasedChannel } from "discord.js";

interface Song {
  title: string;
  stream: any;
  commentary?: string;
}

const apologies = [
  "aw flip! i did an oopsie im sorry - i couldnt play that song",
  "BRAAAP. im so sorry trumpy, i failed to play that one ew woo",
  "Tom mahoney aw aw aw, he diggin in me - sorry i cant play that im busy right now",
  "OH MY GOD THEY HIT THE SECOND TOWER",
  "Oh my god max hargreaves you gypsy, im gonna touch tipsy tommy.",
  "Tralalero Tralala holy poo balls",
];

export const musicPlayers = new Map<string, MusicPlayer>();

export class MusicPlayer {
  private history: Song[] = [];
  private queue: Song[] = [];
  private player: AudioPlayer;
  private playing: boolean = false;
  private songsSinceLastAnnouncement: number = 1;
  private outputChannel?: TextBasedChannel;

  constructor(outputChannel?: TextBasedChannel) {
    this.outputChannel = outputChannel;

    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playNext();
    });

    this.player.on("error", async (error) => {
      console.error("Error in AudioPlayer:", error);
      const apology = apologies[randomInt(0, apologies.length)];
      console.log("Announcing my fuckup:", apology);
      await this.announce(apology);
    });
  }

  getPlayer() {
    return this.player;
  }

  enqueue(song: Song) {
    this.queue.push(song);
    if (!this.playing) {
      this.playNext();
    }
  }

  async getYTSong(title: string) {
    const video = await youtubeSearch(title, 1);
    const videoId = video.items[0].id;
    return {
      title: title,
      stream: youtubeStream(videoId),
      commentary: await getDJCommentary(
        `${video.items[0].title} - ${video.items[0].channelTitle}`
      ),
    } as Song;
  }

  async getYTStream(title: string) {
    const video = await youtubeSearch(title, 1);
    const videoId = video.items[0].id;
    return youtubeStream(videoId);
  }

  async announce(commentary: string) {
    this.playing = true;
    this.songsSinceLastAnnouncement = 0;

    return this.player.play(
      createAudioResource(createAudioStreamFromText(commentary))
    );
  }

  async djSong() {
    let nextSong;
    if (this.history[this.history.length - 1]) {
      nextSong = await getNextSong(this.history[this.history.length - 1].title);
    } else {
      nextSong = await getNextSong("bjork - oh so quiet");
    }
    return {
      title: nextSong.nextSong,
      stream: await this.getYTStream(nextSong.nextSong),
      commentary: nextSong.djCommentary,
    } as Song;
  }

  private async playNext() {
    if (this.songsSinceLastAnnouncement > 0 && this.queue[0]?.commentary) {
      try {
        await this.announce(this.queue[0].commentary);
      } catch (e) {
        console.error("Failed to announce:", e);
      }
      return;
    } else {
      this.songsSinceLastAnnouncement++;
    }

    let nextSong = this.queue.shift();
    if (nextSong) this.history.push(nextSong);

    if (!nextSong) {
      nextSong = await this.djSong();
    }

    this.playing = true;

    try {
      this.player.play(createAudioResource(nextSong.stream));
      if (this.outputChannel) {
        await this.outputChannel.send(`▶️ Now playing: **${nextSong.title}**`);
      }
    } catch (e) {
      console.error("Playback error:", e);
      await this.announce("Im sorry i couldnt play that... flip!");
    }
  }
}
