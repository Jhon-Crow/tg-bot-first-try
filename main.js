import { Telegraf, Scenes, session } from "telegraf";
import config from "config";
import { withIntervalSMS } from "./src/withIntervalSMS.js";
import { taskList } from "./src/taskList.js";
import { helpMessage } from "./src/helpMessage.js";
import OpenAI from "openai";
import axios from "axios";
import {statusMessage} from "./src/statusMessage.js";

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

let intervalId;
let intervalMinutes;

const openai = new OpenAI({
    apiKey: config.get('GPT_API_KEY'),
    baseURL: 'https://api.pawan.krd/v1',
});

// Создаем сцену для установки интервала
const intervalScene = new Scenes.BaseScene('intervalScene');

intervalScene.enter((ctx) => {
    ctx.reply("Пожалуйста, введите интервал времени в минутах:");
});

intervalScene.on('text', async (ctx) => {
    const input = ctx.message.text.replace(/.*?(\d+).*/, '$1');
    const intervalNumber = parseInt(input, 10);

    if (!isNaN(intervalNumber) && intervalNumber > 0) {
        intervalMinutes = intervalNumber;
        await ctx.reply(`Интервал ${intervalMinutes} минут(ы)`);
        await ctx.scene.leave();
        await statusMessage(ctx, intervalMinutes, intervalId);
        if (!intervalId) await ctx.reply(`Чтобы запустить напоминание о <b>${taskList[0]}</b> каждые ${intervalMinutes} минут\n/start `, { parse_mode: 'HTML' });
    } else {
        await ctx.reply("Пожалуйста, введите корректное положительное число минут.");
    }
});

// Создаем экземпляр сцены
const stage = new Scenes.Stage([intervalScene]);
bot.use(session());
bot.use(stage.middleware());

async function getChatResponse(message) {
    const chatCompletion = await openai.chat.completions.create({
        model: 'pai-001-rp',
        messages: [{ role: 'user', content: message }],
    });
    return chatCompletion.choices[0].message.content;
}

export async function getChatRemainingCredits() {
    try {
        const res = await axios.get('https://api.pawan.krd/info', {
            headers: {
                'Authorization': `Bearer ${config.get('GPT_API_KEY')}`
            }
        });

        const { credit } = res.data.info;
        return `Оставшиеся кредиты: ${Math.round(credit)}`;
    } catch (error) {
        return 'Ошибка при получении кредитов: ' + error;
    }
}

export const promptForGptAsk = async (ctx, text) => {
    if (text) {
        const res = await getChatResponse(text);
        await ctx.reply(res);
    }
}

bot.command('gpt', async (ctx) => {
    await promptForGptAsk(ctx, ctx.message.text.replace(/\/[^ ]*\s?/, '').trim())
    await statusMessage(ctx, intervalMinutes, intervalId);
});

bot.command('info', async (ctx) => {
    const res = await getChatRemainingCredits();
    await ctx.reply(res);
});



const promptForStart = async (ctx) => {
        helpMessage(ctx);

    if (!taskList[0]) {
        await ctx.reply('Список задач пуст! Используйте /todo + "ваш текст" чтобы добавить задачу');
        return;
    }
    if (!intervalMinutes) {
        await ctx.reply('Таймер не установлен! Используйте /setinterval чтобы установить его');
        return;
    }
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = withIntervalSMS(ctx, taskList[0], intervalMinutes);
    await ctx.reply(`Напоминание о задаче: \n <b>${taskList[0]}</b> \n будет отправляться каждые ${intervalMinutes} минут(ы)`, { parse_mode: 'HTML' });
}

bot.command('help', (ctx) => helpMessage(ctx, intervalMinutes, intervalId));
bot.command('status', (ctx) => statusMessage(ctx, intervalMinutes, intervalId));

bot.command('start', async (ctx) => {
    await promptForStart(ctx);
    await statusMessage(ctx, intervalMinutes, intervalId);
});

const promptForStop = async (ctx) => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        await ctx.reply(`Отправка сообщений ${taskList[0]} остановлена.`);
    } else {
        await ctx.reply("Нет активной отправки сообщений.");
    }
}

bot.command('stop', async (ctx) => {
    await promptForStop(ctx);
    await statusMessage(ctx, intervalMinutes, intervalId);
});

bot.command('todo', async (ctx) => {
    const taskText = ctx.message.text.replace(/\/[^ ]*\s?/, '').trim();
    if (taskText) {
        taskList.unshift(taskText);
        await ctx.reply(`Добавлена задача ☐<b>${taskList[0]}</b>`, { parse_mode: 'HTML' });
        await ctx.reply(intervalId ? 'Для запуска просто нажми /start' : 'Задай частоту сообщений /setinterval')
    } else {
        await ctx.reply('Некорректный текст задачи');
    }
    await statusMessage(ctx, intervalMinutes, intervalId);
});

bot.command('setinterval', async (ctx) => {
    await ctx.scene.enter('intervalScene');
});

bot.command('showlist', async (ctx) => {
    await ctx.reply(
        taskList.length
            ? taskList.map((t, i) => `${i + 1}) <b>${t}</b>`).join('\n')
            : 'Пусто(', { parse_mode: 'HTML' });
});

bot.command('deltask', async (ctx) => {
    await promptForStop(ctx);
    ctx.reply(taskList[0] ? `Задача <b>${taskList.shift()}</b> удалена (осталось ${taskList.length})` : 'Список и так пуст', { parse_mode: 'HTML' });
    if (taskList.length) {
        if (intervalId) {
            clearInterval(intervalId);
        }
        intervalId = await withIntervalSMS(ctx, taskList[0], intervalMinutes);
    }
    await statusMessage(ctx, intervalMinutes, intervalId);
});

bot.command('delAll', async (ctx) => {
    taskList.length = 0;
    ctx.reply('Весь список удалён!');
    await statusMessage(ctx, intervalMinutes, intervalId);
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));