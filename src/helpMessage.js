export function helpMessage(ctx, pinIt, intervalMinutes) {
    const helpText = 'Команды: \n' +
        '    /start - запустить напоминалку\n' +
        '    /stop - остановить\n' +
        '    /todo - добавить задачу\n' +
        '    /setinterval - указать частоту отправки сообщения\n' +
        '    /showlist - показать весь список задач\n' +
        '    /deltask - удалить последнюю задачу\n' +
        '    /delAll - удалить ВЕСЬ СПИСОК\n' +
        '    /help - вызвать это сообщение\n' +
        '\n' +
        '' + `Интервал ${intervalMinutes ? intervalMinutes + ' minutes' : 'не задан'}`


        ctx.reply(helpText, { parse_mode: 'HTML' }).then(
            sentMessage => {
                if(pinIt) ctx.telegram.pinChatMessage(ctx.chat.id, sentMessage.message_id);
        }
        );

}