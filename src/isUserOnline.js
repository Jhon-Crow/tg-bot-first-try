export async function isUserOnline(ctx) {
    try {
        const chatMember = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
        return chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator';
    } catch (error) {
        console.error('Ошибка при получении статуса пользователя:', error);
        return false; // Если произошла ошибка, считаем, что пользователь не онлайн
    }
}