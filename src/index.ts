import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  REST,
  Routes,
} from "discord.js";
import dotenv from "dotenv";

dotenv.config();

// Define the command interface
interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Extend the Discord.js Client class
class DiscordClient extends Client {
  commands: Collection<string, Command>;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.commands = new Collection();
  }
}

const client = new DiscordClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load and register commands
export async function loadCommands() {
  const commands: SlashCommandBuilder[] = [];
  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file: string) => file.endsWith(".ts"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        const commandModule = await import(`file://${filePath}`);
        const command = commandModule.default || commandModule;

        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
          commands.push(command.data);
          console.log(`✅ Registered command: ${command.data.name}`);
        } else {
          console.warn(
            `⚠️ Command at ${filePath} is missing required properties`
          );
        }
      } catch (error) {
        console.error(`❌ Error loading command from ${filePath}:`, error);
      }
    }
  }

  return commands;
}

// Deploy commands to Discord
export async function deployCommands(commands: SlashCommandBuilder[]) {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    throw new Error("Missing required environment variables");
  }

  const rest = new REST().setToken(token);

  try {
    console.log(`🔄 Deploying ${commands.length} commands...`);
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands.map((cmd) => cmd.toJSON()),
    });
    console.log(`✅ Successfully deployed ${data.length} commands`);
  } catch (error) {
    console.error("❌ Error deploying commands:", error);
  }
}

// Initialize bot
async function initializeBot() {
  try {
    // Load and deploy commands
    const commands = await loadCommands();

    // Set up event handlers
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`Command ${interaction.commandName} not found`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const reply = {
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    });

    client.once(Events.ClientReady, (readyClient) => {
      console.log(`🤖 Bot is ready! Logged in as ${readyClient.user.tag}`);
    });

    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Failed to initialize bot:", error);
    process.exit(1);
  }
}

// Start the bot
initializeBot().catch(console.error);
