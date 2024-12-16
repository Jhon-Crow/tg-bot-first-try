export function withIntervalSMS(ctx, message,  intervalMinutes) {
    return setInterval(async () => {
        await ctx.reply('☐' + message);
    }, intervalMinutes * 60000);
}



