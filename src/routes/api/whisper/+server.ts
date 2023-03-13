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

        const requestData = await request.formData()
        if (!requestData) {
            throw new Error('No request data')
        }

        const reqFile = requestData.get('file') as File
        const reqLanguage = requestData.get('language') as string
        const formData = new FormData()
        formData.append('file', reqFile)
        formData.append("language", reqLanguage != null ? reqLanguage : "en" )
        formData.append('model', 'whisper-1')
        const transcribeResponse = await fetch("https://api.openai.com/v1/audio/transcriptions",{
            headers: {
                Authorization: `Bearer ${OPENAI_KEY}`
            },
            method: 'POST',
            body: formData
        })
        
        return new Response(transcribeResponse.body,{
            headers: {
                'Content-Type': 'text/event-stream'
            }
        })

    }catch (err){
		console.log(err instanceof Error ? err.message : err)
		return json({ error: 'There was an error processing your request' }, { status: 500 })
    }
}