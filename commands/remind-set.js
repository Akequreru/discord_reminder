const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind-set')
        .setDescription('リマインド設定（管理者用）')
        .addStringOption(option =>
            option.setName('time').setDescription('時間（例： 08:00）').setRequired(true))
        .addChannelOption(option =>
            option.setName('channel').setDescription('送信先').setRequired(true))
        .addStringOption(option =>
            option.setName('mention')
                .setDescription('メンションの有無').setRequired(true)
                .addChoices(
                    { name: 'なし', value: 'none' },
                    { name: '@everyone', value: 'everyone' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const timeInput = interaction.options.getString('time');
        const channel = interaction.options.getChannel('channel');
        const mention = interaction.options.getString('mention') || 'none';
        const status = interaction.options.getInteger('status') ?? 1;
        const guildId = interaction.guildId;

        const [hours, minutes] = timeInput.split(':').map(Number);
        const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        try {
            await interaction.client.db.run(
                'REPLACE INTO settings (guild_id, remind_time, channel_id, mention_type, is_active) VALUES (?, ?, ?, ?, ?)',
                [guildId, time, channel.id, mention, status]
            );
            
            const statusText = status === 1 ? "有効" : "無効";
            const mentionText = mention === 'everyone' ? "@everyone あり" : "メンションなし";
            
            await interaction.reply(`✅ 設定完了: [${statusText}]\n時間: **${time}**\n送信先: <#${channel.id}>\n通知: ${mentionText}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '設定中にエラーが発生しました。', ephemeral: true });
        }
    },
};