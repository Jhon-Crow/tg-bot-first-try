import {taskList} from "./taskList.js";
import {getChatRemainingCredits} from "../main.js";

let statusMessageId;
export async function statusMessage(ctx, intervalMinutes, intervalId) {
    const res = await getChatRemainingCredits();
    const statusText = `Интервал <b>${intervalMinutes ? intervalMinutes +
        ' minutes' : 'не задан'} (${intervalId ? intervalId +
        ' активен' : 'нет активного'})</b> \n\nАктивная задача: <b>${taskList.length ? taskList[0] : 'не задана'}</b>\n\n<b>${res}</b>`;
    if (!statusMessageId){
        ctx.reply(statusText, {parse_mode: 'HTML'}).then(
            sentMessage => {
                    ctx.telegram.pinChatMessage(ctx.chat.id, sentMessage.message_id);
                    statusMessageId = sentMessage.message_id;
            }
        )
    } else {
        ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMessageId,
            null,
            statusText, {parse_mode: 'HTML'}
        ).catch(err => {
            console.error('Error editing message:', err);
        });
    }

}