<script lang="ts">
	import { getTokens } from '$lib/tokenizer'
	import type { Auth} from 'firebase/auth'
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai'
	import { createEventDispatcher, each } from 'svelte/internal'
	import CodeBlock from './CodeBlock.svelte';
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdBookmarkBorder from 'svelte-icons/md/MdBookmarkBorder.svelte'
	export let type: ChatCompletionRequestMessageRoleEnum
	export let message: string
	export let loading = false
	export let user: any
	export let index : number
	export let bookmarked : boolean

	const dispatch = createEventDispatcher();

	function formatText(message: string) {
		let formattedText = ""; // initialize the formatted text string
		let parts: any[] = []; // initialize the parts array
		parts = message.split("```"); // split the text by the code block delimiter

		for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 0) {
			// if this is not a code block, format the list
			parts[i] = parts[i].trim().replace(/`(.+?)`/g,"<b>$1</b>")
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

		return parts;
	}

	function bookmarkMessage() {
		dispatch("bookmark", {
			index : index,
		})
	}

</script>

<div class={"flex gap-4 justify-center p-4 " + (type === "user" ? "bg-base-200": "bg-base-300")}>
	{#if bookmarked}
		<div id={"bookmark-"+ index}>
		</div>
	{/if}
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
	
	<div class="w-full flex flex-col text-base-content md:max-w-screen-lg max-w-full gap-4 overflow-x-hidden">
		<div class="w-full text-base-content flex-col items-center">
			{#if type === "user"}
			{message}
			{:else}
			{#each formatText(message) as block}
				{#if typeof block === 'string'}
					{@html block}
				{:else}
					<CodeBlock code={block.code} />
				{/if}
			{/each}
			{/if}
			{#if loading}
				<progress class="progress progress-primary w-full"></progress>
			{/if}
			
		</div>
		<div class="self-end items-center flex">
			<button class="btn btn-ghost btn-xs" on:click={bookmarkMessage}>
				{#if bookmarked}
					<MdBookmark />
				{:else}
					<MdBookmarkBorder />
				{/if}
			</button>
			<div class="btn btn-ghost btn-xs">
				{(type == "user" ? "Prompt ":"Completion ")  + getTokens(message) + " tokens"}
			</div>
		</div>
	</div>
</div>
