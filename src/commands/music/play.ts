import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  createAudioResource,
} from "@discordjs/voice";
import { getNextSong } from "../../AI/dj-functions.js";
import { createAudioStreamFromText } from "../../AI/tts.js";
import { musicPlayers, MusicPlayer } from "../../Music/music-player.js";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The song to play (URL or search query)")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member;

    if (!member || !member.voice.channel) {
      await interaction.reply({
        content: "🎤 You must be in a voice channel to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const voiceChannel = member.voice.channel;
    const guildId = voiceChannel.guild.id;
    const query = interaction.options.getString("query", true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      let player = musicPlayers.get(guildId);
      if (!player) {
        player = new MusicPlayer(interaction.channel);
        musicPlayers.set(guildId, player);

        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guildId,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
          console.log("Voice connection ready!");
          connection.subscribe(player.getPlayer());
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            await Promise.race([
              connection.rejoin(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Voice connection timeout")),
                  5000
                )
              ),
            ]);
          } catch {
            connection.destroy();
            musicPlayers.delete(guildId);
          }
        });
      }

      console.log("Attempting play inside play command, with query", query);
      player?.enqueue(await player?.getYTSong(query));

      await interaction.editReply(`🎶 Queued: ${query}`);
    } catch (err) {
      console.error("Error in /play command:", err);
      await interaction.editReply(
        "⚠️ Something went wrong while playing the track."
      );
    }
  },
};

export default command;
