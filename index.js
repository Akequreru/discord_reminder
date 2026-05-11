const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
const { token } = require('./config.json');
const client = new Client({
  intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b)
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands')
const commandsFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandsFiles){
  const filePath = path.join(commandsPath, file);
  const command = require(filePath)
  if('data' in command && 'execute' in command){
    client.commands.set(command.data.name, command);
  }else{
    console.log(`[WARNING] ${filePath}のコマンドには必要な"data"または"execute"プロパティが含まれていません`)
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if(!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if(!command){
    console.error(`${interection.commandName}というコマンドは存在しません`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error){
    console.error(error);
    await interaction.reply({
      content:'コマンド実行中にエラーが発生しました',
      ephemeral: true
    })
  }
});

client.on("ready", () => {
  console.log(`${client.user.tag} でログインしています。`);
});

client.login(token);