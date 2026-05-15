import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { nutritionCommand } from './commands/nutrition.js';
import { retrospectiveCommand } from './commands/retrospective.js';
import { routePlannerCommand } from './commands/route-planner.js';
import { workPartnerCommand } from './commands/work-partner.js';
import { helpCommand } from './commands/help.js';

config();

const commands = [
  nutritionCommand.data.toJSON(),
  retrospectiveCommand.data.toJSON(),
  routePlannerCommand.data.toJSON(),
  workPartnerCommand.data.toJSON(),
  helpCommand.data.toJSON(),
];
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
