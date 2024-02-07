import GPT3TokenizerImport from 'gpt3-tokenizer'
import type { ChatCompletionRequestMessage } from 'openai'

const GPT3Tokenizer: typeof GPT3TokenizerImport =
	typeof GPT3TokenizerImport === 'function'
		? GPT3TokenizerImport
		: (GPT3TokenizerImport as any).default

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

export function getTokens(input: string): number {
	try{
		const tokens = tokenizer.encode(input)
		return tokens.text.length
	}catch(e){
		throw new Error('Error in getTokens: ' + e)
		return 0
	}
}

export function getTotalTokens(chatMessages: ChatCompletionRequestMessage[]){
	let tokens = 0
	chatMessages.forEach((message) => {
		tokens += getTokens(message.content)
	})

	return tokens
}

export function getTokensFromAllThreads(threads: any[]){
	let tokens = 0
	threads.forEach((thread: any) => {
		thread.messages.forEach((message: any) => {
			tokens += getTokens(message.content)
		})
	})

	return tokens
}

export function getTotalImageCost(imageMessage: any[],model: string){
	let s_count = 0
	let m_count = 0
	let l_count = 0

	let dall_e_3_standard_square = 0
	let dall_e_3_standard_landscape = 0
	let dall_e_3_standard_portrait = 0

	let dall_e_3_hd_square = 0
	let dall_e_3_hd_landscape = 0
	let dall_e_3_hd_portrait = 0

	console.log(imageMessage);

	imageMessage.forEach((message: any) => {

		const imageCount = parseInt(message.n)

		if(model === 'dall-e-2'){
			if(message.size == "256x256"){
				s_count += imageCount
			}else if(message.size == "512x512"){
				m_count += imageCount
			}else if(message.size == "1024x1024"){
				l_count += imageCount
			}
		}else if(model === 'dall-e-3'){
			if(message.quality === "standard"){
				if(message.size == "1024x1024"){
					dall_e_3_standard_square += imageCount
				}else if(message.size == "1792x1024"){
					dall_e_3_standard_landscape += imageCount
				}else if(message.size == "1024x1792"){
					dall_e_3_standard_portrait += imageCount
				}
			}else if(message.quality === "hd"){
				if(message.size == "1024x1024"){
					dall_e_3_hd_square += imageCount
				}else if(message.size == "1792x1024"){
					dall_e_3_hd_landscape += imageCount
				}else if(message.size == "1024x1792"){
					dall_e_3_hd_portrait += imageCount
				}
			}
		}
	})

	return {
		s_count: s_count,
		m_count: m_count,
		l_count: l_count,
		dall_e_3_standard_square: dall_e_3_standard_square,
		dall_e_3_standard_landscape: dall_e_3_standard_landscape,
		dall_e_3_standard_portrait: dall_e_3_standard_portrait,
		dall_e_3_hd_square: dall_e_3_hd_square,
		dall_e_3_hd_landscape: dall_e_3_hd_landscape,
		dall_e_3_hd_portrait: dall_e_3_hd_portrait
	}
}

export function getImageCostFromAllThreads(threads: any[]){
	let s_count = 0
	let m_count = 0
	let l_count = 0

	threads.forEach((thread: any) => {
		thread.messages.forEach((message: any) => {
			if(message.size == "256x256"){
				s_count += message.n
			}else if(message.size == "512x512"){
				m_count += message.n
			}else if(message.size == "1024x1024"){
				l_count += message.n
			}
		})
	})

	return {
		s_count: s_count,
		m_count: m_count,
		l_count: l_count
	}
}
