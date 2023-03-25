<script lang="ts">
	import { getTokens } from '$lib/tokenizer'
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai'
	import { createEventDispatcher, each, escape } from 'svelte/internal'
	import CodeBlock from './CodeBlock.svelte';
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdBookmarkBorder from 'svelte-icons/md/MdBookmarkBorder.svelte'
	import SvelteMarkdown from 'svelte-markdown'
	
	export let type: ChatCompletionRequestMessageRoleEnum
	export let message: string
	export let loading = false
	export let user: any
	export let index : number
	export let bookmarked : boolean

	const dispatch = createEventDispatcher();

	function bookmarkMessage() {
		dispatch("bookmark", {
			index : index,
		})
	}

</script>

<div class={"flex self-stretch gap-4 justify-center p-4 " + (type === "user" ? "bg-base-200": "bg-base-300")}>
	{#if bookmarked}
		<div id={"bookmark-"+ index}>
		</div>
	{/if}
	<div class="chat-image avatar self-start">
		<div class="sm:w-8 w-0 rounded-full">
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
		<div class="w-full flex-col items-center prose">
			<SvelteMarkdown source={message}  renderers={{
				code: CodeBlock
			}} />
			{#if loading}
				<progress class="progress progress-primary w-full"></progress>
			{/if}
			
		</div>
		<div class="self-end items-center flex gap-4">
			<button class="btn btn-ghost btn-xs btn-square" on:click={bookmarkMessage}>
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