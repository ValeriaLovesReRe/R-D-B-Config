const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DISCORD_CHANNEL_ID = "1522985065854795986";
const BOT_TOKEN = process.env.DISCORD_TOKEN;

const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let messages = [];

bot.once('ready', () => {
    console.log(`✅ Bot online as ${bot.user.tag}`);
});

bot.on('messageCreate', async (message) => {
    if (message.channel.id === DISCORD_CHANNEL_ID && !message.author.bot) {
        messages.push({
            id: Date.now(),
            author: message.author.username,
            content: message.content
        });
        if (messages.length > 200) messages.shift();
    }

    // !DM Command
    if (message.content.toLowerCase() === '!dm' && message.reference) {
        const referencedMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        
        if (!referencedMsg) {
            return message.reply("Could not find the referenced message.");
        }

        const target = referencedMsg.author;

        try {
            const dmChannel = await message.guild.channels.create({
                name: `dm-${message.author.username}-${Date.now().toString().slice(-6)}`,
                type: 0,
                permissionOverwrites: [
                    { id: message.guild.id, deny: ['ViewChannel'] },
                    { id: message.author.id, allow: ['ViewChannel', 'SendMessages'] },
                    { id: target.id, allow: ['ViewChannel', 'SendMessages'] },
                    { id: bot.user.id, allow: ['ViewChannel', 'SendMessages'] }
                ]
            });

            dmChannel.send(`**Private DM Started**\nBetween ${message.author} and ${target}`);
            message.reply(`✅ Private DM channel created: ${dmChannel}`);
        } catch (err) {
            message.reply("Failed to create DM channel. Check bot permissions.");
            console.error(err);
        }

        message.delete().catch(() => {});
    }
});

app.get('/messages', (req, res) => {
    res.json(messages);
});

app.post('/send', (req, res) => {
    const { author, content } = req.body;
    
    if (!author || !content) {
        return res.status(400).send("Missing data");
    }

    const channel = bot.channels.cache.get(DISCORD_CHANNEL_ID);
    if (channel) {
        channel.send(`**${author}** (Roblox): ${content}`)
            .then(() => res.sendStatus(200))
            .catch(err => {
                console.error(err);
                res.status(500).send("Failed");
            });
    } else {
        res.status(404).send("Channel not found");
    }
});

bot.login(BOT_TOKEN).catch(err => console.error("Login error:", err));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
