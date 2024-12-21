
export function helpMessage(ctx) {
    const helpText = 'Команды: \n' +
        '    /start - запустить напоминалку\n' +
        '    /stop - остановить\n' +
        '    /todo - добавить задачу\n' +
        '    /setinterval - указать частоту отправки сообщения\n' +
        '    /showlist - показать весь список задач\n' +
        '    /deltask - удалить последнюю задачу\n' +
        '    /delAll - удалить ВЕСЬ СПИСОК\n' +
        '    /help - вызвать это сообщение\n' +
        '    /status - для ручного обновления статуса\n'
        ctx.reply(helpText, { parse_mode: 'HTML' })
}