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
		console.log(message);
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
