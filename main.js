import { Telegraf, Scenes, session } from "telegraf";
import config from "config";
import { withIntervalSMS } from "./src/withIntervalSMS.js";
import { taskList } from "./src/taskList.js";
import { helpMessage } from "./src/helpMessage.js";
import OpenAI from "openai";
import axios from "axios";

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

let intervalId;
let intervalMinutes;
let isFirstEnter = true;

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
        await ctx.scene.leave(); // Выходим из сцены
        await promptForStart(ctx); // Запускаем следующий шаг
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

async function getChatRemainingCredits() {
    try {
        const res = await axios.get('https://api.pawan.krd/info', {
            headers: {
                'Authorization': `Bearer ${config.get('GPT_API_KEY')}`
            }
        });

        const { credit } = res.data.info;
        return `Оставшиеся кредиты: ${credit}`;
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

bot.command('gpt', async (ctx) => promptForGptAsk(ctx, ctx.message.text.replace(/\/[^ ]*\s?/, '').trim()));

bot.command('info', async (ctx) => {
    const res = await getChatRemainingCredits();
    await ctx.reply(res);
});

const promptForStart = async (ctx) => {
    if (isFirstEnter) {
        helpMessage(ctx, isFirstEnter);
        isFirstEnter = false;
    }
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

bot.command('help', (ctx) => helpMessage(ctx, isFirstEnter, intervalMinutes, intervalId));

bot.command('start', async (ctx) => promptForStart(ctx));

const promptForStop = async (ctx) => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        await ctx.reply(`Отправка сообщений ${taskList[0]} остановлена.`);
    } else {
        await ctx.reply("Нет активной отправки сообщений.");
    }
}

bot.command('stop', async (ctx) => promptForStop(ctx));

bot.command('todo', async (ctx) => {
    const taskText = ctx.message.text.replace(/\/[^ ]*\s?/, '').trim();
    if (taskText) {
        taskList.unshift(taskText);
        await ctx.reply(`Добавлена задача ☐<b>${taskList[0]}</b>`, { parse_mode: 'HTML' });
        await ctx.reply('Для запуска просто нажми /start')
    } else {
        await ctx.reply('Некорректный текст задачи');
    }
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
});

bot.command('delAll', async (ctx) => {
    taskList.length = 0; // Очищаем список задач
    ctx.reply('Весь список удалён!');
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));