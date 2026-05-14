const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('指定した日の予定を確認します')
        .addStringOption(option =>
            option.setName('date').setDescription('日付（例： 05/14）').setRequired(true)),

    async execute(interaction) {
        const db = interaction.client.db;

        if(!db){
            return await interaction.reply({content: 'データベースの準備ができていません', empheral: true});
        }

        const inputDate = interaction.options.getString('date');
        
        // --- 日付の整形ロジック (登録時と同じ) ---
        const now = new Date();
        let year = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const [inputMonth, inputDay] = inputDate.split('/').map(Number);

        if (inputMonth < currentMonth) {
            year += 1;
        }

        const formattedMonth = String(inputMonth).padStart(2, '0');
        const formattedDay = String(inputDay).padStart(2, '0');
        const searchDate = `${year}-${formattedMonth}-${formattedDay}`;
        // ---------------------------------------

        const guildId = interaction.guildId;

        try {
            // 指定された日付の予定を時間順にすべて取得
            const rows = await db.all(
                'SELECT time, content FROM schedules WHERE guild_id = ? AND date = ? ORDER BY time ASC',
                [guildId, searchDate]
            );

            if (rows.length === 0) {
                return await interaction.reply(`${inputDate} の予定はありません。`);
            }

            // 予定をリスト形式に整形
            let response = `**${searchDate} の予定一覧**\n`;
            rows.forEach(row => {
                response += `・${row.time} : ${row.content}\n`;
            });

            await interaction.reply(response);

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '予定の取得中にエラーが発生しました。', ephemeral: true });
        }
    },
};