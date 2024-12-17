import {taskList} from "./taskList.js";

export function helpMessage(ctx, pinIt, intervalMinutes, intervalId) {
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
        '' + `Интервал <b>${intervalMinutes ? intervalMinutes + ' minutes' : 'не задан'} (${intervalId ? intervalId + ' активен' : 'нет активного'})</b> \n\nАктивная задача: <b>${taskList.length ? taskList[0] : 'не задана'}</b>`


        ctx.reply(helpText, { parse_mode: 'HTML' }).then(
            sentMessage => {
                if(pinIt) ctx.telegram.pinChatMessage(ctx.chat.id, sentMessage.message_id);
        }
        );

}