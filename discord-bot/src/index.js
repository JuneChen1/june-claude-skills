import { Client, GatewayIntentBits, Collection, MessageFlags } from 'discord.js';
import { config } from 'dotenv';
import { nutritionCommand, handleNutritionMessage } from './commands/nutrition.js';

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

client.once('clientReady', () => {
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

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  try {
    await handleNutritionMessage(message);
  } catch (err) {
    console.error(err);
    await message.channel.send('發生錯誤，請稍後再試。');
  }
});

client.login(process.env.DISCORD_TOKEN);
