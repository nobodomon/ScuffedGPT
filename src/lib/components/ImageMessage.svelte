<script lang="ts">
	import { getTokens } from '$lib/tokenizer'
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai'
	import { createEventDispatcher, each, escape } from 'svelte/internal'
	import CodeBlock from './CodeBlock.svelte';
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdBookmarkBorder from 'svelte-icons/md/MdBookmarkBorder.svelte'
	import SvelteMarkdown from 'svelte-markdown'
	
	export let type: ChatCompletionRequestMessageRoleEnum
	export let message: any
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
			{#if typeof message === "string"}
                {message}
            {:else}
            <div class="grid gap-4 grid-cols-2 p-4 bg-neutral rounded-box max-w-fit">
                
                {#each message as image, index}
                    <div class="rounded-box">
                        <img src={`data:image/jpeg;base64, ${image.b64_json?? ""}`} alt="" class="rounded-box max-w-[256px]" />
                    </div> 
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
			
		</div>
	</div>
</div>