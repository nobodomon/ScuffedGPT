import GPT3TokenizerImport from 'gpt3-tokenizer'
import type { ChatCompletionRequestMessage } from 'openai'

const GPT3Tokenizer: typeof GPT3TokenizerImport =
	typeof GPT3TokenizerImport === 'function'
		? GPT3TokenizerImport
		: (GPT3TokenizerImport as any).default

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

export function getTokens(input: string): number {
	const tokens = tokenizer.encode(input)
	return tokens.text.length
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

export function getTotalImageCost(imageMessage: any[]){
	let s_count = 0
	let m_count = 0
	let l_count = 0

	console.log(imageMessage);

	imageMessage.forEach((message: any) => {
		if(message.size == "256x256"){
			s_count += message.n
		}else if(message.size == "512x512"){
			m_count += message.n
		}else if(message.size == "1024x1024"){
			l_count += message.n
		}
	})

	return {
		s_count: s_count,
		m_count: m_count,
		l_count: l_count
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
