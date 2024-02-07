<script lang="ts">
	import { getTokens } from '$lib/tokenizer'
	import type { ChatCompletionRequestMessageRoleEnum } from 'openai'
	import { createEventDispatcher, each, escape } from 'svelte/internal'
	import CodeBlock from './CodeBlock.svelte';
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdBookmarkBorder from 'svelte-icons/md/MdBookmarkBorder.svelte'
	import MdSave from 'svelte-icons/md/MdSave.svelte'
	import SvelteMarkdown from 'svelte-markdown'
	import moment from 'moment'
	
	export let type: ChatCompletionRequestMessageRoleEnum
	export let message: any
	export let user: any
	export let index : number
	export let bookmarked : boolean
	export let expiry : string
	export let size : string

	const dispatch = createEventDispatcher();

	function bookmarkMessage() {
		dispatch("bookmark", {
			index : index,
		})
	}

	const getHeight = (dimension:string) => {
		const height = dimension.split("x")[1]
		return (256/ parseInt(height) * parseInt(height));
	}

	const getWidth = (dimension:string) => {
		const width = dimension.split("x")[0]
		return (256/ parseInt(width) * parseInt(width));
	}

	const isExpired = (expiry:string) => {
		return moment(new Date(parseInt(expiry) * 1000).toLocaleString()).add(1,'hour').isBefore(moment());
	}

	const getExpiresIn = (expiry:string) => {
		return moment(new Date(parseInt(expiry) * 1000).toLocaleString()).add(1,'hour').fromNow();
	}

	const revisePrompt = (prompt:any) => {
		dispatch("revisePrompt", {
			prompt : prompt
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
            <div class="flex flex-col p-4 rounded-box w-full">
                
                <div class="flex flex-col items-stretch w-full gap-4 p-4">
					{#each message as image, imageIndex}
						<div class="rounded-box flex w-full justify-between gap-4 relative">
							{#if isExpired(expiry) || expiry == undefined}
								<div class="rounded-box min-w-[256px] h-[256px] flex items-center justify-center bg-base-200">
									<span class="text-xs font-bold text-error">Image Expired</span>
								</div>
							{:else}
							<img src={image.url?? ""} alt="" class={`rounded-box min-w-[${getWidth(size)}px] min-h-[${getHeight(size)}px] bg-base-200`} />
							{/if}

							{#if image.revised_prompt}
								<div class="flex flex-col items-start justify-start gap-4">
									<span class="text-xs text-primary">{image.revised_prompt?? ""}</span>

									<button class="btn btn-primary" on:click={(e)=>{
										revisePrompt(image.revised_prompt)
									}}>
										Use Suggested Prompt
									</button>
								</div>
							{/if}

							
						</div> 
					{/each}
					
					<span></span>
				</div>
            </div>
            {/if}
			
		</div>
		<div class="self-end items-center flex gap-4">
			{#if typeof message !== 'string'}
				{#if isExpired(expiry) || expiry == undefined}
					<div class="badge badge-error">
						Image Expired
					</div>
				{:else}
					<div class="badge badge-primary">
						Image(s) Expires {getExpiresIn(expiry)}
					</div>
				{/if}
			{/if}
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