const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require("discord.js");
const config = require("./config.json");
const ms = require("ms");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const cooldowns = new Collection();

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith("!تقديم")) return;

  const userId = message.author.id;
  const cooldown = cooldowns.get(userId);
  const now = Date.now();

  if (cooldown && now - cooldown < ms(config.applicationCooldown)) {
    const remaining = ms(ms(config.applicationCooldown) - (now - cooldown), { long: true });
    return message.reply(`⏳ يجب الانتظار ${remaining} قبل تقديم طلب جديد.`);
  }

  const filter = (m) => m.author.id === message.author.id;
  const answers = [];

  const questions = [config.q1, config.q2, config.q3, config.q4, config.q5];

  for (let i = 0; i < questions.length; i++) {
    await message.channel.send(questions[i]);
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
    const response = collected.first();
    if (!response) return message.channel.send("⏰ انتهى الوقت، حاول مرة أخرى.");
    answers.push(response.content);
  }

  const embed = new EmbedBuilder()
    .setTitle(config.title)
    .addFields(
      { name: config.q1, value: answers[0] },
      { name: config.q2, value: answers[1] },
      { name: config.q3, value: answers[2] },
      { name: config.q4, value: answers[3] },
      { name: config.q5, value: answers[4] }
    )
    .setColor(config.embedcolor)
    .setFooter({ text: `مقدم الطلب: ${message.author.tag}` })
    .setTimestamp();

  try {
    const channel = await client.channels.fetch(config.channel_id);
    await channel.send({ embeds: [embed] });
    cooldowns.set(userId, now);
    message.channel.send(config.donesend);
  } catch (err) {
    console.error(err);
    message.channel.send("❌ حدث خطأ أثناء إرسال الطلب.");
  }
});

client.login(process.env.TOKEN);