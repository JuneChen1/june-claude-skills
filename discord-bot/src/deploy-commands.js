import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { nutritionCommand } from './commands/nutrition.js';

config();

const commands = [nutritionCommand.data.toJSON()];
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('Done.');
  } catch (err) {
    console.error('Failed to register commands:', err.message);
    process.exit(1);
  }
})();
