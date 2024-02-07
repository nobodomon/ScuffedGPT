import { OPENAI_KEY } from '$env/static/private'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'
import type { RequestHandler } from './$types'
import OpenAI from 'openai'

export const config: Config = {
    runtime: 'edge'
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        if (!OPENAI_KEY) {
            throw new Error('OPENAI_KEY env variable not set')
        }

		const openai = new OpenAI({
			apiKey: OPENAI_KEY
		})

        const requestData = await request.formData()
        if (!requestData) {
            throw new Error('No request data')
        }

        const reqFile = requestData.get('file') as string
        const originalFileName = requestData.get('originalFileName') as string
        const readFile = await fetch(reqFile)
        const fileBlob = await readFile.blob()

        const reqLanguage = requestData.get('language') as string
        // const transcribeResponse = await fetch("https://api.openai.com/v1/audio/transcriptions",{
        //     headers: {
        //         Authorization: `Bearer ${OPENAI_KEY}`
        //     },
        //     method: 'POST',
        //     body: formData
        // })
        const fileObj = new File([fileBlob], originalFileName, {type: fileBlob.type})
        
        const transcribeResponse = await openai.audio.transcriptions.create(
            {
                file: fileObj,
                language: reqLanguage != null ? reqLanguage : "en",
                model: 'whisper-1',
                response_format: 'verbose_json'
            }
        )
        
        
        // return new Response(transcribeResponse.body,{
        //     headers: {
        //         'Content-Type': 'text/event-stream'
        //     }
        // })

        return json(transcribeResponse, { status: 200})

    }catch (err){
		//console.log(err instanceof Error ? err.message : err)

        console.log(err)

		return json({ error: 'There was an error processing your request' }, { status: 500 })
    }
}