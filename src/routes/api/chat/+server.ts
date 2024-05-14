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

export const POST = (async ({ request }) => {
	try {
		if (!OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set')
		}

		
		const openai = new OpenAI({
			apiKey: OPENAI_KEY
		})

		//console.log(await request.json());

		let {messages, data, model, systemMessage, imageReferences} = await request.json();


		

		//console.log(await request.json());
		

		if (!messages) {
			throw new Error('no messages provided')
		}

		
		let tokenCount = 0
		
		//Input transform for GPT-4-Vision model
		if(['gpt-4-vision-preview', 'gpt-4o'].includes(model)){
			messages.forEach((msg: any, index: number) => {
				if(index == messages.length - 1){
					const newContent = []
					newContent.push({type: 'text', text: msg.content})
	
					if(imageReferences.length > 0) {
						for(const image of imageReferences) {
							newContent.push({type: 'image_url', image_url: {
								url: image.url,
								detail: "auto"
							}})
						}
					}
					messages[index] = {
						role: msg.role,
						content: newContent
					}
				}else{
					const newContent = [];
	
					newContent.push({type: 'text', text: msg.content})
	
					// if(msg.imageReference) {
					// 	for(const image of msg.imageReference) {
					// 		newContent.push({type: 'image_url', image_url: {
					// 			url: image.url,
					// 			detail: "high"
					// 		}})
					// 	}
					// }
	
					messages[index] = {
						role: msg.role,
						content: newContent
					}
				}
			})
		}

		//Token limit check
		messages.forEach((msg: any) => {
			//console.log("L81", msg)
			if(['gpt-4-vision-preview', 'gpt-4o'].includes(model)){
				const tokens = getTokens(msg.content.find((content: any) => content.type === 'text').text)
				tokenCount += tokens
			}else{
				
				const tokens = getTokens(msg.content)
				tokenCount += tokens
			}
		})

		const prompt = (systemMessage || 'You are a virtual assistant to replace ChatGPT when it is down. Your name is ScuffedGPT.')
		tokenCount += getTokens(prompt)

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
			case 'gpt-4o':
				tokenLimit = 128000
				break
			default:
				tokenLimit = 4096
				break
		}
		
		while (tokenCount > tokenLimit) {
			messages.shift()
			if(['gpt-4-vision-preview', 'gpt-4o'].includes(model)){
				tokenCount -= getTokens(messages[0].content.find((content: any) => content.type === 'text').text)
			}else{
				
				tokenCount -= getTokens(messages[0].content)
			}
		}

		//Prepend system message
		const payloadMessage  = [
			{ role: 'system', content: imageReferences.length > 0 ? [
				{type: 'text', text: prompt},
			] : prompt },
			...messages
		]

		//Delete unnecessary fields
		for(const message of payloadMessage) {
			delete message.name
			delete message.profilePic
			delete message.id
			delete message.createdAt
			delete message.imageReference
		}

		//Moderations
		let lastMessage = "";

		if(['gpt-4-vision-preview', 'gpt-4o'].includes(model)){
			lastMessage = payloadMessage[payloadMessage.length - 1].content.find((content: any) => content.type === 'text').text
		}else{
			lastMessage = payloadMessage[payloadMessage.length - 1].content
		}


		const moderation = await openai.moderations.create({input: lastMessage, model: 'text-moderation-stable'});

		const moderationResults = moderation['results'][0];

		if(moderationResults.flagged){
			
			throw new Error(`Your message was flagged as inappropriate.`);

		}
		
		const chatResponse = await openai.chat.completions.create({
			model: model,
			messages: payloadMessage,
			stream: true,
			max_tokens: model === 'gpt-4-vision-preview' ? 4096 : undefined,
		})

		const stream = OpenAIStream(chatResponse);

		return new StreamingTextResponse(stream);
	}
	catch (err: OpenAIError | any) {
		console.log(JSON.stringify(err))
		console.error(err.error)
		const error = err?.message ?? err?.error?.message?? err?? 'There was an error processing your request'
		return json({ error: error }, { status: 500 })
	} finally {
		//console.log('finally')
	
	}
}) satisfies RequestHandler
