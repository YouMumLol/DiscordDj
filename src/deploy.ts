import { loadCommands, deployCommands } from "index.ts";

const commands = await loadCommands();
await deployCommands(commands);
