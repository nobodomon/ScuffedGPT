<script lang="ts">
	import { getTokens } from '$lib/tokenizer'
	import { createEventDispatcher, each, escape } from 'svelte/internal'
	import CodeBlock from './CodeBlock.svelte';
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdBookmarkBorder from 'svelte-icons/md/MdBookmarkBorder.svelte'
	import SvelteMarkdown from 'svelte-markdown'
	import { auth } from '../../firebase'
	
	export let type: string
	export let message: string
	export let profilePic: string | undefined
	export let name : string | undefined
	export let loading = false
	export let user: any
	export let index : number
	export let bookmarked : boolean
	export let imageReference : any[] | undefined

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
				{#if profilePic}
				<img src={profilePic ?? auth.currentUser?.photoURL} alt="user avatar" /> 
				{:else}
				<img src={"https://ui-avatars.com/api/?name=" + user.email[0]} alt="user avatar" />
				{/if}
			{:else}
				<img src="https://ui-avatars.com/api/?name=S" alt="user avatar" />
			{/if}
		</div>
	</div>
	<div class="w-full flex flex-col text-base-content md:max-w-screen-lg max-w-full gap-4 overflow-x-hidden">
			{#if type == 'user'}	
			<div class="chat-header font-bold">
				{name ?? auth.currentUser?.displayName}
			</div>
		{:else}
			<div class="chat-header font-bold">ScuffedGPT</div>
		{/if}
		<div class="w-full flex-col items-center overflow-x-auto isolate">
			<SvelteMarkdown source={message}  renderers={{
				code: CodeBlock
			}} />
			{#if imageReference}
				<div class="flex gap-4 mt-4">
					{#each imageReference as image}
					<img src={image.url} alt={image.name} class="w-24 h-24 rounded-md" />
				{/each}
				</div>
			{/if}
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