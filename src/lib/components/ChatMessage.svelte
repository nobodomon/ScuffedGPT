<script lang="ts">
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai'
	import CodeBlock from './CodeBlock.svelte';
	export let type: ChatCompletionRequestMessageRoleEnum
	export let message: string


	const codeRegex = /```([\s\S]*?)```/g;

	message.replace(codeRegex, (match, code) => 
		`<CodeBlock>${code}</CodeBlock>`
	)

	function parseCodeBlocks(text : string){
		const regex = /```([\s\S]*?)```/g;
		const codeBlocks = [];
		return text.split(codeRegex).map((str, index) => {
			if (index % 2 === 0) {
				return str;
			} else {
				return {
				type: "code",
				content: str.trim(),
				};
			}
		});
	}

	let parsedMessage = parseCodeBlocks(message);
</script>

<div class="chat {type === 'user' ? 'chat-end' : 'chat-start'} justify-end">
	<div class="chat-image avatar">
		<div class="w-10 rounded-full">
			<img
				src="https://ui-avatars.com/api/?name={type === 'user' ? 'Me' : 'S'}"
				alt="{type} avatar"
			/>
		</div>
	</div>
	<div class="chat-header">
		{type === 'user' ? 'Me' : 'ScuffedGPT'}
	</div>
	<div class="chat-bubble {type === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
		{#each parsedMessage as message}
			{#if typeof message === 'string' }
				{message}
			{:else if message.type === 'code'}
				<CodeBlock code={message.content} />
			{/if}
		{/each}
	</div>
</div>
