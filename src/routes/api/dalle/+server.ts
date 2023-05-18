import { OPENAI_KEY } from '$env/static/private'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'
import type { RequestHandler } from './$types'

export const config: Config = {
    runtime: 'edge'
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        if (!OPENAI_KEY) {
            throw new Error('OPENAI_KEY env variable not set')
        }

        console.log(request);

        const requestData = await request.formData()
        if (!requestData) {
            throw new Error('No request data')
        }

        const prompt = requestData.get('prompt') as string
        const n = requestData.get('n') as string
        const size = requestData.get('size') as string
        
        try {
            const parsedN = parseInt(n);
            const generationResponse = await fetch("https://api.openai.com/v1/images/generations",{
                headers: {
                    Authorization: `Bearer ${OPENAI_KEY}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    prompt: prompt,
                    n: parsedN,
                    size: size != null ? size : "256x256"
                })
            })
            
            return new Response(generationResponse.body,{
                headers: {
                    'Content-Type': 'text/event-stream'
                }
            })
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