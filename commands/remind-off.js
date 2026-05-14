const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind-off')
        .setDescription('リマインドを停止します')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const db = interaction.client.db;
        const guildId = interaction.guildId;

        try {
            await db.run(
                'UPDATE settings SET is_active = 0 WHERE guild_id = ?',
                [guildId]
            );
            await interaction.reply('📴 リマインドを無効にしました。再開するには `/remind-set` で設定し直してください。');
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
        }
    },
};