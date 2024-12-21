import {promptForGptAsk} from "../api/webhook.js";
import dotenv from 'dotenv';
dotenv.config();
const firstPart = process.env.GPT_TEMPLATE_1;
const secondPart = process.env.GPT_TEMPLATE_2;
export function withIntervalSMS(ctx, message,  intervalMinutes) {
    const lastPart = `\nВот моё имя 
    ${ctx.from.first_name} ${ctx.from.last_name}`
    return setInterval(async () => {
            await promptForGptAsk(ctx,firstPart + message + secondPart + lastPart, true);
    }, intervalMinutes * 10000);
}




