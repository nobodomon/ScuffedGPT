<script lang="ts">
	import LoginBlock from '$lib/components/LoginBlock.svelte'
	import '../app.css'
	import { auth } from '../firebase'
	import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
	import Threads from '$lib/components/Threads.svelte'
	import Chat from '$lib/components/Chat.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'

	let loggedIn: boolean = false
	let uid = ''

	auth.onAuthStateChanged((user) => {
		if (user) {
			// User is signed in, see docs for a list of available properties
			// https://firebase.google.com/docs/reference/js/firebase.User
			uid = user.uid
			loggedIn = true
			// ...
		} else {
			// User is signed out
			// ...
			uid = ''
			loggedIn = false
		}
	})

	const handleLogout = async () => {
		try {
			const auth = getAuth()
			await auth.signOut()
		} catch (error) {
			console.log(error)
		}
	}

	let messages: ChatCompletionRequestMessage[] = []
	let currThreadID: string = ''
	let threadName: string = ''

	let chat : Chat;
	const handleThreadSwitch = (e: any) => {
		messages = e.detail.messages
		currThreadID = e.detail.threadID
		threadName = e.detail.threadName
		chat.scrollToBottom()
	}

	let threads: Threads

	async function handleThreadAdd(e: any) {
		console.log('handleThreadAdd')

		await threads.refreshThreads()
		currThreadID = e.detail.threadID
		threadName = e.detail.threadName
		messages = e.detail.messages
	}
</script>

<div class="drawer drawer-mobile h-[100svh] max-h-[100svh]">
	<input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content max-h-[100svh] flex flex-col">
		<div class="w-full navbar bg-base-100">
			<div class="flex-none">
				<label for="my-drawer-2">
					<div class="btn btn-ghost btn-square">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="inline-block w-5 h-5 stroke-current"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/></svg
						>
					</div>
				</label>
			</div>
			<div class="flex-1">
				<span class="btn btn-ghost normal-case text-xl">ScuffedGPT</span>
			</div>
		</div>
		{#if loggedIn}
			<Chat
			chatMessages={messages}
			threadID={currThreadID}
			threadname={threadName}
			on:threadswitch={handleThreadAdd}
			bind:this={chat}
		/>
		{:else}
			<div class="h-full w-100 grow flex items-center place-self-center">
				<LoginBlock />
			</div>
		{/if}
	</div>
	<div class="drawer-side">
		<label for="my-drawer-2" class="drawer-overlay" />
		<ul class="menu p-4 w-80 bg-base-100 text-base-content">
			<!-- Sidebar content here -->

			{#if loggedIn}
				<form on:submit|preventDefault={() => handleLogout()} class="pb-4">
					<button type="submit" class="btn btn-primary w-full">Logout</button>
				</form>
				<Threads
					on:threadswitch={handleThreadSwitch}
					on:threadswitchNew={handleThreadSwitch}
					bind:this={threads}
					{currThreadID}
					{uid}
				/>
			{/if}
		</ul>
	</div>
</div>
