<script lang="ts">
	import type { Auth} from 'firebase/auth'
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai'
	import { each } from 'svelte/internal'
	import CodeBlock from './CodeBlock.svelte';
	export let type: ChatCompletionRequestMessageRoleEnum
	export let message: string
	export let loading = false
	export let user: any
	let formattedText = ""; // initialize the formatted text string
	let inCodeBlock = false; // keep track of whether we are inside a code block or not

	let parts: any[] = []; // initialize the parts array

	function formatText(message: string) {
		parts = message.split("```"); // split the text by the code block delimiter

		for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 0) {
			// if this is not a code block, format the list
			parts[i] = parts[i].trim().split("\n").map((item: any) => `<li>${item}&nbsp;</li>`).join("");
			parts[i] = `<ul>${parts[i]}</ul>`;
		} else {
			// if this is a code block, surround it with <code> tags
			parts[i] = {
				type : "Codeblock",
				code : parts[i]
			};
		}
		}
    // combine the parts back into a single string
    	formattedText = parts.join("");
	}

	formatText(message);
</script>

<div class={"flex gap-4 justify-start p-4 " + (type === "user" ? "bg-base-200": "bg-base-300")}>
	<div class="chat-image avatar self-start">
		<div class="w-8 rounded-full">
			<!-- <img
				src="https://ui-avatars.com/api/?name={type === 'user' ? 'Me' : 'S'}"
				alt="{type} avatar"
			/> -->

			{#if type === "user"}
				{#if user.photoURL}
				<img src={user.photoURL} alt="user avatar" /> 
				{:else}
				<img src={"https://ui-avatars.com/api/?name=" + user.email[0]} alt="user avatar" />
				{/if}
			{:else}
				<img src="https://ui-avatars.com/api/?name=S" alt="user avatar" />
			{/if}
		</div>
	</div>
	
	<div class="w-full">
		{#each parts as block}
			{#if typeof block === 'string'}
				{@html block}
			{:else}
				<CodeBlock code={block.code} />
			{/if}
		{/each}

		{#if loading}
			<progress class="progress progress-primary w-full"></progress>
		{/if}
	</div>
</div>
