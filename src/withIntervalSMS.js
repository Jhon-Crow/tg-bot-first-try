import config from "config";
import {promptForGptAsk} from "./main.js";

const firstPart = config.get('GPT_TEMPLATE_1');
const secondPart = config.get('GPT_TEMPLATE_2');
export function withIntervalSMS(ctx, message,  intervalMinutes) {
    return setInterval(async () => {
        await promptForGptAsk(ctx,firstPart + message + secondPart);
        // await ctx.reply(firstPart + message + secondPart);
    }, intervalMinutes * 60000);
}



