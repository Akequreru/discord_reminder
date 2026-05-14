const fs = require('node:fs');
const path = require('node:path');
const cron = require('node-cron');
const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
const { token } = require('./config.json');

const client = new Client({
    intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b)
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandsFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandsFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] ${filePath} のコマンドには必要な "data" または "execute" プロパティが含まれていません`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        // スペル修正 interection -> interaction
        console.error(`${interaction.commandName} というコマンドは存在しません`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました', ephemeral: true });
        } else {
            await interaction.reply({ content: 'コマンド実行中にエラーが発生しました', ephemeral: true });
        }
    }
});

// 警告に従い Events.ClientReady に変更
client.on(Events.ClientReady, () => {
    console.log(`${client.user.tag} でログインしています。`);
});

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// データベースの初期化（即時実行関数）
(async () => {
    try {
        const db = await open({
            filename: './database.sqlite',
            driver: sqlite3.Database // splote3 -> sqlite3
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL, 
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                content TEXT NOT NULL,
                UNIQUE(guild_id, date, time)
            )
        `);

        await db.exec(`
          CREATE TABLE IF NOT EXISTS settings(
              guild_id TEXT PRIMARY KEY,
              remind_time TEXT DEFAULT '08:00',
              channel_id TEXT,
              mention_type TEXT DEFAULT 'none', -- 'none' (なし) または 'everyone'
              is_active INTEGER DEFAULT 1       -- 1 (有効) または 0 (無効)
          )
      `);

        client.db = db;
        console.log("Database Ready!");
    } catch (error) {
        console.error("Database Error:", error);
    }
})(); // ここで最後に () をつけて実行させる

// index.js の末尾付近に追加

// 1分ごとに実行 (* * * * *)
cron.schedule('* * * * *', async () => {
    if (!client.db) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
        // 設定が「有効 (is_active = 1)」かつ「今の時間」のサーバーを取得
        const configs = await client.db.all(
            'SELECT * FROM settings WHERE remind_time = ? AND is_active = 1',
            [currentTime]
        );

        for (const config of configs) {
            const schedules = await client.db.all(
                'SELECT time, content FROM schedules WHERE guild_id = ? AND date = ? ORDER BY time ASC',
                [config.guild_id, today]
            );

            if (schedules.length === 0) continue;

            const channel = await client.channels.fetch(config.channel_id).catch(() => null);
            if (channel) {
                // メンションの設定に応じてプレフィックスを変える
                let prefix = config.mention_type === 'everyone' ? "@everyone\n" : "";
                let message = `${prefix}☀️ **おはようございます！今日の予定をお知らせします**\n`;
                
                schedules.forEach(s => {
                    message += `・${s.time} : ${s.content}\n`;
                });
                
                await channel.send(message);
            }
        }
    } catch (error) {
        console.error("Reminder Loop Error:", error);
    }
});

client.login(token);