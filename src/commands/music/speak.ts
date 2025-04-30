import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import { createAudioStreamFromText } from "../../AI/tts";
import { play } from "elevenlabs";

export default {
  data: new SlashCommandBuilder()
    .setName("tts")
    .setDescription("Text to speech"),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.member) {
      if (interaction.member.voice.channel) {
        const voiceChannel = interaction.member.voice.channel;
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        connection.on(VoiceConnectionStatus.Ready, () => {
          console.log(
            "The connection has entered the Ready state - ready to play audio!"
          );

          const player = createAudioPlayer({
            behaviors: {
              noSubscriber: NoSubscriberBehavior.Pause,
            },
          });
          const resource = createAudioResource(
            createAudioStreamFromText("Hello black")
          );
          player.play(resource);

          player.on(AudioPlayerStatus.Playing, () => {
            console.log("The audio player has started playing!");
          });

          player.on("error", (error) => {
            console.error(
              `Error: ${error.message} with resource ${error.resource.metadata.title}`
            );
            player.play(getNextResource());
          });

          // Play "track.mp3" across two voice connections
          connection.subscribe(player);
        });
        await interaction.deferReply();
      } else {
        await interaction.reply(
          "You must be in a voice channel to use this command."
        );
      }
    } else {
      await interaction.reply("You must be in a server to use this command.");
    }
  },
};
