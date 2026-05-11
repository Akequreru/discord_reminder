const {SlashCommandBuilder} = require('discord.js');

module.exports={
    data:new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong!と返信'),
    async execute(interection){
        await interection.reply('Pong!')
    }
}