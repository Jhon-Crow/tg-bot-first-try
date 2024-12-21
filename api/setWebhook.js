import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
export async function setWebhook() {
    try {
        const webhookUrl = 'https://tg-bot-first-try-219t.vercel.app/api/webhook';
        const response = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`, {
            url: webhookUrl
        });
        console.log('Webhook set successfully:', response.data);
    } catch (error) {
        console.error('Error setting webhook:', error.response ? error.response.data : error.message);
    }
}