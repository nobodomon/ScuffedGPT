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

const calculateImageToken = (width: number, height:number) => {
    const area = width * height;

    const basePricingArea = 512 * 512;

    const token = Math.ceil(area / basePricingArea);

    return 170 * token;
}


export function getImageTokens(imageReference: any[]): number {
	
    let imageTokensUsed = 0;
	for(const reference of imageReference){
		const width = reference.fileDimensions?.width ?? 0
		const height = reference.fileDimensions?.height ?? 0
        imageTokensUsed += calculateImageToken(width, height);
    }

	return imageTokensUsed

}

export function getTotalTokens(chatMessages: ChatCompletionRequestMessage[], model: string){
	let promptTokens = 0
	let answerTokens = 0

	switch(model){
		//Deprecated
		case 'gpt-3.5-turbo-preview':
			chatMessages.forEach((message) => {
				if(message.role === 'assistant'){
					answerTokens += getTokens(message.content)
				}else{
					promptTokens += getTokens(message.content)
				}
			})
			break
		case "gpt-3.5-turbo-0125":
			chatMessages.forEach((message) => {
				if(message.role === 'assistant'){
					answerTokens += getTokens(message.content)
				}else{
					promptTokens += getTokens(message.content)
				}
			})
			return {
				promptTokens: promptTokens,
				promptCosts: (promptTokens / 1000 * 0.0005),
				answerTokens: answerTokens,
				answerCosts: (answerTokens / 1000 * 0.0015),
				totalTokens: promptTokens + answerTokens,
				cost: (promptTokens / 1000 * 0.0005) + (answerTokens / 1000 * 0.0015)
			}
		//Deprecated
		case 'gpt-4-turbo-preview':
			chatMessages.forEach((message) => {
				if(message.role === 'assistant'){
					answerTokens += getTokens(message.content)
				}else{
					promptTokens += getTokens(message.content)
				}
			})
			return {
				promptTokens: promptTokens,
				promptCosts: (promptTokens / 1000 * 0.005),
				answerTokens: answerTokens,
				answerCosts: (answerTokens / 1000 * 0.015),
				totalTokens: promptTokens + answerTokens,
				cost: (promptTokens / 1000 * 0.005) + (answerTokens / 1000 * 0.015)
			}
		//Deprecated
		case 'gpt-4-vision-preview':
			chatMessages.forEach((message) => {
				
				if(message.role === 'assistant'){
					answerTokens += getTokens(message.content)
				}else{
					promptTokens += getTokens(message.content)
					
					if(message.imageReference.length > 0) {
						promptTokens += getImageTokens(message.imageReference);
					}
				}
			})
			return {
				promptTokens: promptTokens,
				promptCosts: (promptTokens / 1000 * 0.005),
				answerTokens: answerTokens,
				answerCosts: (answerTokens / 1000 * 0.015),
				totalTokens: promptTokens + answerTokens,
				cost: (promptTokens / 1000 * 0.005) + (answerTokens / 1000 * 0.015)
			}
		case 'gpt-4o':
			chatMessages.forEach((message) => {
				
				if(message.role === 'assistant'){
					answerTokens += getTokens(message.content)
				}else{
					promptTokens += getTokens(message.content)
					
					if(message.imageReference?.length > 0) {
						promptTokens += getImageTokens(message.imageReference);
					}
				}
			})

			
			return {
				promptTokens: promptTokens,
				promptCosts: (promptTokens / 1000 * 0.005),
				answerTokens: answerTokens,
				answerCosts: (answerTokens / 1000 * 0.015),
				totalTokens: promptTokens + answerTokens,
				cost: (promptTokens / 1000 * 0.005) + (answerTokens / 1000 * 0.015)
			}
		default:
			return{
				promptTokens: 0,
				promptCosts: 0,
				answerTokens: 0,
				answerCosts: 0,
				totalTokens: 0,
				cost: 0
			}
	}

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
