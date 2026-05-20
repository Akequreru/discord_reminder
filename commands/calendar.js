const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

// 現在の年から前後1年を計算
const currentYear = new Date().getFullYear(); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('指定した月のカレンダー（予定付き）を表示します')
        .addIntegerOption(option =>
            option.setName('year')
                .setDescription('年を選択（指定しない場合は今年）')
                .setRequired(false)
                .addChoices(
                    { name: `${currentYear - 1}年`, value: currentYear - 1 },
                    { name: `${currentYear}年`, value: currentYear },
                    { name: `${currentYear + 1}年`, value: currentYear + 1 }
                ))
        .addIntegerOption(option =>
            option.setName('month')
                .setDescription('月を選択（指定しない場合は今月）')
                .setRequired(false)
                .addChoices(
                    { name: '1月', value: 1 }, { name: '2月', value: 2 },
                    { name: '3月', value: 3 }, { name: '4月', value: 4 },
                    { name: '5月', value: 5 }, { name: '6月', value: 6 },
                    { name: '7月', value: 7 }, { name: '8月', value: 8 },
                    { name: '9月', value: 9 }, { name: '10月', value: 10 },
                    { name: '11月', value: 11 }, { name: '12月', value: 12 }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const db = interaction.client.db;
        const guildId = interaction.guildId;

        // 1. ユーザーが選択した値を取得（選ばれていない場合は現在の年・月を使う）
        const now = new Date();
        const year = interaction.options.getInteger('year') ?? now.getFullYear();
        const selectedMonth = interaction.options.getInteger('month') ?? (now.getMonth() + 1);
        
        // Dateオブジェクト用に月を0〜11に調整
        const month = selectedMonth - 1; 

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // カレンダーに表示する「年-月」の文字列 (検索用)
        const searchMonth = `${year}-${String(selectedMonth).padStart(2, '0')}`;

        try {
            // 2. データベースから指定された月の予定をすべて取得
            const rows = await db.all(
                "SELECT date, time, content FROM schedules WHERE guild_id = ? AND date LIKE ? ORDER BY date ASC, time ASC",
                [guildId, `${searchMonth}-%`]
            );

            const scheduleMap = {};
            rows.forEach(row => {
                if (!scheduleMap[row.date]) scheduleMap[row.date] = [];
                scheduleMap[row.date].push(row);
            });

            // 3. カレンダーのマス目（日付配列）を生成
            const dateHtmlParts = [];
            
            for (let i = 0; i < firstDay.getDay(); i++) {
                dateHtmlParts.push('<div class="day empty"></div>');
            }

            for (let d = 1; d <= lastDay.getDate(); d++) {
                const currentDateStr = `${searchMonth}-${String(d).padStart(2, '0')}`;
                const daySchedules = scheduleMap[currentDateStr] || [];

                let scheduleHtml = '';
                daySchedules.forEach(s => {
                    scheduleHtml += `<div class="schedule-item"><span class="s-time">${s.time}</span> ${s.content}</div>`;
                });

                // 表示中カレンダーの「年・月・日」が、本当に「今日」と一致するときだけ today クラスを付与
                const isToday = (year === now.getFullYear() && selectedMonth === (now.getMonth() + 1) && d === now.getDate()) ? 'today' : '';

                dateHtmlParts.push(`
                    <div class="day ${isToday}">
                        <div class="day-number">${d}</div>
                        <div class="schedule-container">${scheduleHtml}</div>
                    </div>
                `);
            }

            // 4. HTML / CSS の組み立て (変更なし)
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
                        background-color: #2f3136;
                        color: #dcddde;
                        margin: 0;
                        padding: 20px;
                        width: 1000px;
                    }
                    .calendar-title {
                        text-align: center;
                        font-size: 28px;
                        margin-bottom: 20px;
                        color: #ffffff;
                        font-weight: bold;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 8px;
                    }
                    .weekday {
                        text-align: center;
                        font-weight: bold;
                        padding: 10px;
                        background-color: #23272a;
                        border-radius: 4px;
                    }
                    .weekday:nth-child(1) { color: #f04747; }
                    .weekday:nth-child(7) { color: #00b0f4; }
                    
                    .day {
                        background-color: #36393f;
                        border-radius: 6px;
                        min-height: 120px;
                        padding: 6px;
                        box-sizing: border-box;
                        border: 1px solid #202225;
                    }
                    .day.empty {
                        background-color: transparent;
                        border: none;
                    }
                    .day.today {
                        border: 2px solid #7289da;
                        background-color: #3c3f45;
                    }
                    .day-number {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 6px;
                    }
                    .schedule-container {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .schedule-item {
                        font-size: 11px;
                        background-color: #4f545c;
                        padding: 2px 4px;
                        border-radius: 3px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        color: #add8e6;
                    }
                    .s-time {
                        font-weight: bold;
                        color: #b9bbbe;
                        margin-right: 2px;
                    }
                </style>
            </head>
            <body>
                <div class="calendar-title">${year}年 ${selectedMonth}月</div>
                <div class="grid">
                    <div class="weekday">日</div>
                    <div class="weekday">月</div>
                    <div class="weekday">火</div>
                    <div class="weekday">水</div>
                    <div class="weekday">木</div>
                    <div class="weekday">金</div>
                    <div class="weekday">土</div>
                    ${dateHtmlParts.join('')}
                </div>
            </body>
            </html>
            `;

            // 5. Puppeteerレンダリング (変更なし)
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.setViewport({ width: 1040, height: 950 });
            await page.setContent(htmlContent);
            const imageBuffer = await page.screenshot({ type: 'png' });
            await browser.close();

            const attachment = new AttachmentBuilder(imageBuffer, { name: 'calendar.png' });
            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'カレンダー画像の生成中にエラーが発生しました。' });
        }
    },
};