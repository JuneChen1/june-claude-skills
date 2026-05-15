import { Client, GatewayIntentBits, Collection, MessageFlags, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { nutritionCommand, handleNutritionMessage } from './commands/nutrition.js';
import { retrospectiveCommand, handleRetrospectiveMessage } from './commands/retrospective.js';
import { routePlannerCommand, handleRoutePlannerMessage } from './commands/route-planner.js';
import { workPartnerCommand, handleWorkPartnerMessage } from './commands/work-partner.js';
import { helpCommand } from './commands/help.js';
import { stopCommand } from './commands/stop.js';
import { getSkill, deleteSession, hasSession, cleanupSessions } from './utils/sessions.js';

const STOP_KEYWORDS = new Set(['結束', '掰掰', '掰', 'bye', 'exit', 'quit', '停止', '結束對話', '沒事了']);

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.commands.set(nutritionCommand.data.name, nutritionCommand);
client.commands.set(retrospectiveCommand.data.name, retrospectiveCommand);
client.commands.set(routePlannerCommand.data.name, routePlannerCommand);
client.commands.set(workPartnerCommand.data.name, workPartnerCommand);
client.commands.set(helpCommand.data.name, helpCommand);
client.commands.set(stopCommand.data.name, stopCommand);

client.once('clientReady', async () => {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const commandDefs = [...client.commands.values()].map(c => c.data.toJSON());
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandDefs });
  } catch (err) {
    console.error('指令註冊失敗：', err);
  }
  cleanupSessions();
  console.log(`Bot ready: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: '發生錯誤，請稍後再試。', flags: MessageFlags.Ephemeral };
    interaction.replied || interaction.deferred
      ? await interaction.followUp(msg)
      : await interaction.reply(msg);
  }
});

const skillHandlers = {
  nutrition: handleNutritionMessage,
  retrospective: handleRetrospectiveMessage,
  'route-planner': handleRoutePlannerMessage,
  'work-partner': handleWorkPartnerMessage,
};

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!hasSession(message.author.id)) return;

  if (STOP_KEYWORDS.has(message.content.trim().toLowerCase())) {
    deleteSession(message.author.id);
    await message.reply('對話已結束。需要的時候再呼叫我。');
    return;
  }

  const skill = getSkill(message.author.id);
  const handler = skillHandlers[skill];
  if (!handler) return;
  try {
    await handler(message);
  } catch (err) {
    console.error(err);
    await message.channel.send('發生錯誤，請稍後再試。');
  }
});

client.login(process.env.DISCORD_TOKEN);
