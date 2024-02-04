import { OPENAI_KEY } from '$env/static/private'
import OpenAI from 'openai'
import type { RequestHandler } from './$types'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'

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

		
		const openai = new OpenAI({
			apiKey: OPENAI_KEY
		})

		//console.log(await request.json());

		const {messages, data, model, systemMessage, imageReferences} = await request.json()



		console.log('messages', messages);
		console.log('data', data);
		console.log('model', model);
		console.log('systemMessage', systemMessage);
		console.log('imageReferences', imageReferences);


		if (!messages) {
			throw new Error('no messages provided')
		}

		let tokenCount = 0

		if(imageReferences.length > 0) {

			const lastMessage = messages[messages.length - 1]
			let imageContent = imageReferences.map((image:any) => {
				return {type: 'image_url', url: image.url}
			})
			let newContent= {
				role: lastMessage.role,
				content: [
					{type: 'text', text: lastMessage.content},
					...imageContent
				],
			}

			messages[messages.length - 1] = newContent

			console.log(messages[messages.length - 1])
		}

		messages.forEach((msg: any) => {
			const tokens = getTokens(msg.content)
			tokenCount += tokens
		})

		// const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
		// 	headers: {
		// 		'Content-Type': 'application/json',
		// 		Authorization: `Bearer ${OPENAI_KEY}`
		// 	},
		// 	method: 'POST',
		// 	body: JSON.stringify({
		// 		input: reqMessages[reqMessages.length - 1].content
		// 	})
		// })

		//const moderationData = await moderationRes.json()
		// const [results] = moderationData.results

		// if (results.flagged) {
		// 	throw new Error('Query flagged by openai')
		// }

		const prompt = (systemMessage || 'You are a virtual assistant to replace ChatGPT when it is down. Your name is ScuffedGPT.')
		tokenCount += getTokens(prompt)

		console.log(tokenCount)

		let tokenLimit = 0;

		switch(model) {
			case 'gpt-3.5-turbo':
				tokenLimit = 16385
				break
			case 'gpt-4-turbo-preview':
				tokenLimit = 128000
				break
			case 'gpt-4-vision-preview':
				tokenLimit = 128000
				break
			default:
				tokenLimit = 4096
				break
		}
		
		while (tokenCount > tokenLimit) {
			messages.shift()
			tokenCount -= getTokens(messages[0].content)
		}


		const payloadMessage  = [
			{ role: 'system', content: prompt },
			...messages
		]

		// const chatRequestOpts: any = {
		// 	model: model,
		// 	messages,
		// 	temperature: 0.9,
		// 	stream: true
		// }

		// const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
		// 	headers: {
		// 		Authorization: `Bearer ${OPENAI_KEY}`,
		// 		'Content-Type': 'application/json'
		// 	},
		// 	method: 'POST',
		// 	body: JSON.stringify(chatRequestOpts)
		// })


		// if (!chatResponse.ok) {
		// 	const err = await chatResponse.json()
		// 	console.log(err)
		// 	throw new Error(err)
		// }

		// return new Response(chatResponse.body, {
		// 	headers: {
		// 		'Content-Type': 'text/event-stream'
		// 	}
		// })

		for(const message of payloadMessage) {
			delete message.name
			delete message.profilePic
			delete message.id
			delete message.createdAt
			delete message.imageReference
		}

		// const chatResponse = await openai.chat.completions.create({
		// 	model: model,
		// 	messages: payloadMessage,
		// 	stream: true

		// })


		// for await (const chunk of chatResponse) {
		// 	console.log(chunk)
		// 	// return {
		// 	// 	body: chunk.choices[0]?.delta?.content,
		// 	// 	headers: {
		// 	// 		'Content-Type': 'text/event-stream'
		// 	// 	},
		// 	// 	status: 200
		// 	// }

		// 	// return new Response(chunk.choices[0]?.delta?.content, {
		// 	// 	headers: {
		// 	// 		'Content-Type': 'text/event-stream'
		// 	// 	}
		// 	// })

		// 	console.log(chunk.choices[0]?.delta?.content)

		// 	process.stdout.write(chunk.choices[0]?.delta?.content || '')
		// }

		// let response = ""

		// for await (const chunk of chatResponse) {
		// 	console.log(chunk)
		// 	response += chunk.choices[0]?.delta?.content || ''
		// }
		
		// return new Response(
		// 	response,
		// 	{
		// 		headers: {
		// 			'Content-Type': 'text/event-stream'
		// 		}
		// 	}
		// )

		const stream = OpenAIStream(chatResponse);

		return new StreamingTextResponse(stream);
		

	} catch (err: OpenAIError | any) {
		console.log(JSON.stringify(err))
		console.error(err.error)
		const error = err.error.message ?? 'There was an error processing your request'
		return json({ error: error }, { status: 500 })
	}
}
