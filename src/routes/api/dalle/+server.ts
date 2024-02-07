import { OPENAI_KEY } from '$env/static/private'
import OpenAI from 'openai'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'
import type { RequestHandler } from './$types'

import {OpenAIStream, StreamingTextResponse} from 'ai'
import type { OpenAIError } from 'openai/error'

export const config: Config = {
    runtime: 'edge'
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        if (!OPENAI_KEY) {
            throw new Error('OPENAI_KEY env variable not set')
        }

        const requestData = await request.formData()
        if (!requestData) {
            throw new Error('No request data')
        }

		const openai = new OpenAI({
			apiKey: OPENAI_KEY
		})
    

        const prompt = requestData.get('prompt') as string
        const n = requestData.get('n') as string
        const size = requestData.get('size') as "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792"
        const model = requestData.get('model') as "dall-e-2" | "dall-e-3"
        const quality = requestData.get('quality') as 'standard' | 'hd'

        console.log('prompt', prompt)
        console.log('n', n)
        console.log('size', size)
        console.log('model', model)
        console.log('quality', quality)
        

        try {
            const imageResponse = await openai.images.generate({
                prompt: prompt,
                n: parseInt(n),
                size: size != null ? size : "256x256",
                response_format: "url",
                model: model,
                quality: quality
            })
            
            return json(imageResponse, { status: 200})

        }catch (err){
            console.log(err)
            //console.log(err instanceof Error ? err.message : err)
            return json({ error: 'There was an error processing your request' }, { status: 500 })
        }
    }catch (err){
        console.log(err)
		//console.log(err instanceof Error ? err.message : err)
		return json({ error: 'There was an error processing your request' }, { status: 500 })
    }
}