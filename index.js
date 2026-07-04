const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DISCORD_CHANNEL_ID = "PUT_YOUR_CHANNEL_ID_HERE";   // ← Change this
const BOT_TOKEN = process.env.DISCORD_TOKEN;

const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let messages = [];

bot.on('ready', () => {
    console.log(`Bot online as ${bot.user.tag}`);
});

bot.on('messageCreate', (message) => {
    if (message.channel.id === DISCORD_CHANNEL_ID && !message.author.bot) {
        messages.push({
            id: Date.now(),
            author: message.author.username,
            content: message.content
        });
        if (messages.length > 100) messages.shift();
    }
});

app.get('/messages', (req, res) => {
    res.json(messages);
});

app.post('/send', (req, res) => {
    const { author, content } = req.body;
    const channel = bot.channels.cache.get(DISCORD_CHANNEL_ID);
    
    if (channel) {
        channel.send(`**${author}** (Roblox): ${content}`);
        res.sendStatus(200);
    } else {
        res.status(404).send("Channel not found");
    }
});

bot.login(BOT_TOKEN);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
