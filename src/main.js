import { Telegraf } from "telegraf";
import config from "config";
import { withIntervalSMS } from "./withIntervalSMS.js";
import { taskList } from "./taskList.js";
import {helpMessage} from "./helpMessage.js";

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

let intervalId;
let intervalMinutes;
let isFirstEnter = true;

const promptForStart = async (ctx) =>  {
    if(isFirstEnter) {
        helpMessage(ctx, isFirstEnter)
        isFirstEnter = false;
    }
    if (!taskList[0]) {
        await ctx.reply('Список задач пуст! Используйте /todo + "ваш текст" чтоб добавить задачу');
        return;
    }
    if (!intervalMinutes) {
        await ctx.reply('Таймер не установлен! Используйте /setinterval чтоб установить его');
        await promptForInterval(ctx);
        return;
    }
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = withIntervalSMS(ctx, taskList[0], intervalMinutes);
    await ctx.reply(`Сообщение \n <b>${taskList[0]}</b> \n будет отправляться каждые ${intervalMinutes} минут(ы)`, {parse_mode: 'HTML'});
}

bot.command('help', (ctx) => helpMessage(ctx));

bot.command('start', async (ctx) => promptForStart(ctx));

bot.command('stop', async (ctx) => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        await ctx.reply(`Отправка сообщений остановлена.`);
    } else {
        await ctx.reply("Нет активной отправки сообщений.");
    }
});

bot.command('todo', async (ctx) => {
    if(ctx.message.text.replace(/\/[^ ]*\s?/, '').trim()){
        taskList.unshift(ctx.message.text.replace(/\/[^ ]*\s?/, '').trim())
        await ctx.reply(`Добавлена задача ☐<b>${taskList[0]}</b>`, { parse_mode: 'HTML' });
        await promptForStart(ctx);
    } else {
        await ctx.reply('Некорректный текст задачи')
    }
});

bot.command('setinterval', async (ctx) => {
    await promptForInterval(ctx);
});

const promptForInterval = (ctx) => {
    ctx.reply("Пожалуйста, введите интервал времени в минутах:");
    const listener = async (msgCtx) => {
        const input = msgCtx.message.text.replace(/.*?(\d+).*/, '\$1');
        const intervalNumber = parseInt(input, 10);
        if (!isNaN(intervalNumber) && intervalNumber > 0) {
            intervalMinutes = intervalNumber;
            await ctx.reply(`Интервал ${intervalMinutes} минут(ы)`);
            await promptForStart(ctx);
        } else {
            await ctx.reply("Пожалуйста, введите корректное положительное число минут.");
        }
    };
    bot.on('text', listener);
};


bot.command('showlist', async (ctx) => {
    await ctx.reply(
        taskList.length
            ? taskList.map((t, i) => `${i + 1}) <b>${t}</b>`).join('\n')
            : 'Пусто(', { parse_mode: 'HTML' });
});

bot.command('deltask', async (ctx) => {
    ctx.reply(taskList[0] ? `Задача <b>${taskList.shift()}</b> удалена (осталось ${taskList.length})` : 'Список и так пуст', { parse_mode: 'HTML' })
})

bot.command('delAll', async (ctx) => {
    taskList = [];
    ctx.reply('Весь список удалён!')
})

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
