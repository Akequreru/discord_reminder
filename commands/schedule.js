const {SlashCommandBuilder} = require('discord.js');

module.exports={
    data:new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('スケジュールを登録')
        .addStringOption(option =>
            option.setName('date').setDescription('日付（例： 01/01）').setRequired(true))
        .addStringOption(option =>
            option.setName('time').setDescription('時間（例： 13:05）').setRequired(true))
        .addStringOption(option =>
            option.setName('content').setDescription('予定の内容').setRequired(true)),
    async execute(interaction){

        const db = interaction.client.db;

        if(!db){
            return await interaction.reply({content: 'データベースの準備ができていません', empheral: true});
        }

        const inputDate = interaction.options.getString('date');
        const inputTime = interaction.options.getString('time');
        const content = interaction.options.getString('content');
        const guildId = interaction.guildId;
        const userId = interaction.user.id; 

        const today = new Date();
        const year = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const [inputMonth, inputDay] = inputDate.split('/').map(Number);

        if(inputMonth < currentMonth){
            year += 1;
        }

        const formattedMonth = String(inputMonth).padStart(2,'0');
        const formattedDay = String(inputDay).padStart(2,'0');
        const date = `${year}-${formattedMonth}-${formattedDay}`;

        // 時間を ":" で分けて、それぞれを数値として取得
        const [hours, minutes] = inputTime.split(':').map(Number);

        const finalMinutes = minutes || 0;
        // 再び 00:00 形式に変換（ゼロ埋め）
        const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        try{
            await db.run(
                'INSERT INTO schedules (guild_id, user_id, date, time, content) VALUES (?,?,?,?,?)',
                [guildId, userId, date, time, content]
            );
            await interaction.reply(`【登録完了】${date} ${time} : ${content}`);
        }
        catch(error){
            if (error.message.includes('UNIQUE constraint failed')){
                try {
                    // 指定された日付の予定を時間順にすべて取得
                    const rows = await db.all(
                        'SELECT time, content FROM schedules WHERE guild_id = ? AND date = ? AND time = ?',
                        [guildId, date, time]
                    );

                    
                    let response = `${date} ${time}には既に予定があります。\n`
                    // 予定をリスト形式に整形
                    rows.forEach(row => {
                        response += `・登録されている予定：${row.content}\n\n予定を変更したい場合は/changeを、削除したい場合は/deleteをご利用ください`;
                    });

                    await interaction.reply(response);

                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '予定の取得中にエラーが発生しました。', ephemeral: true });
        }
            }
            else {
                console.error(error);
                await interaction.reply({content: 'エラーが発生しました', empheral: true});
            }
        }
    },
};
