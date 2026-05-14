const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('change')
        .setDescription('既存の予定内容を変更します')
        .addStringOption(option =>
            option.setName('date').setDescription('日付（例： 05/14）').setRequired(true))
        .addStringOption(option =>
            option.setName('time').setDescription('時間（例： 13:00）').setRequired(true))
        .addStringOption(option =>
            option.setName('content').setDescription('新しい予定内容').setRequired(true)),

    async execute(interaction) {
        const inputDate = interaction.options.getString('date');
        const inputTime = interaction.options.getString('time');
        const newContent = interaction.options.getString('content');

        // --- 日付整形ロジック (他コマンドと共通) ---
        const now = new Date();
        let year = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const [inputMonth, inputDay] = inputDate.split('/').map(Number);
        if (inputMonth < currentMonth) year += 1;
        const date = `${year}-${String(inputMonth).padStart(2, '0')}-${String(inputDay).padStart(2, '0')}`;
        // ---------------------------------------

        // 時間を ":" で分けて、それぞれを数値として取得
        const [hours, minutes] = inputTime.split(':').map(Number);

        // 再び 00:00 形式に変換（ゼロ埋め）
        const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        const db = interaction.client.db;
        const guildId = interaction.guildId;

        try {
            // 指定された日時の予定があるか確認し、あれば内容を更新
            const result = await db.run(
                'UPDATE schedules SET content = ? WHERE guild_id = ? AND date = ? AND time = ?',
                [newContent, guildId, date, time]
            );

            // changes は「更新された行数」を返す
            if (result.changes === 0) {
                return await interaction.reply({ 
                    content: `${inputDate} ${time} の予定は見つかりませんでした。`, 
                    ephemeral: true 
                });
            }

            await interaction.reply(`【変更完了】${inputDate} ${time} の予定を「${newContent}」に変更しました。`);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '変更中にエラーが発生しました。' });
        }
    },
};