import type { RequestHandler } from "@sveltejs/kit";
import { Telegraf } from "telegraf";
import {message} from 'telegraf/filters'
import { BOT_TOKEN } from '$env/static/private'


const bot = new Telegraf(BOT_TOKEN)

bot.on(message("text"), (ctx) => {
    console.log(ctx.message)
    ctx.reply('Hello')
})

bot.launch({
    webhook: {
        domain: 'https://scuffed-gpt.vercel.app/',
        port: 3000,
        hookPath: '/api/webhook'
    }
})