import config from "config";
import {promptForGptAsk} from "./main.js";

const firstPart = config.get('GPT_TEMPLATE_1');
const secondPart = config.get('GPT_TEMPLATE_2');
export function withIntervalSMS(ctx, message,  intervalMinutes) {
    const lastPart = `\nВот моё имя 
    ${ctx.from.first_name} ${ctx.from.last_name}`
    return setInterval(async () => {
        await promptForGptAsk(ctx,firstPart + message + secondPart + lastPart);
    }, intervalMinutes * 60000);
}




