import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { musicPlayers } from "Music/music-player.js";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the playing song"),
  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.member) {
      if (interaction.member.voice.channel) {
        const voiceChannel = interaction.member.voice.channel;
        const guildId = voiceChannel.guild.id;
        let player = musicPlayers.get(guildId);
        if (player) {
          player.getPlayer().stop();
          interaction.reply({
            content: "Skipped ⏩",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          interaction.reply({
            content: "I couldn't find your queue sorry!",
            flags: MessageFlags.Ephemeral,
          });
        }
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
