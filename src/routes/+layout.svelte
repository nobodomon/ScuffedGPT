<script lang="ts">
	import LoginBlock from '$lib/components/LoginBlock.svelte'
	import '../app.css'
	import { auth,threadsCollection,transcriptionsCollection } from '../firebase'
	import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
	import Transcribe from '$lib/components/Transcribe.svelte'
	import Threads from '$lib/components/Threads.svelte'
	import Chat from '$lib/components/Chat.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'

	import {onSnapshot,getDocs, deleteDoc, setDoc, doc, addDoc, query, where} from "firebase/firestore";
	import Transcriptions from '$lib/components/Transcriptions.svelte'
	import { onMount } from 'svelte'
	import { themeChange } from 'theme-change'

	let loggedIn: boolean = false
	let uid = ''
	let allThreads : ChatCompletionRequestMessage[] = []
	let allTranscriptions : any[] = []

	auth.onAuthStateChanged( async (user) => {
		if (user) {
			// User is signed in, see docs for a list of available properties
			// https://firebase.google.com/docs/reference/js/firebase.User
			uid = user.uid
			loggedIn = true
			allThreads = await loadThreads()
			allTranscriptions = await loadTranscriptions()
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

	onMount(()=>{
		themeChange(false);
	})

	let pageType = 'chat'
	


    async function loadThreads () {
        let threads : any[] = [];
        console.log("Loading threads for user: " + uid)
        const q = query(threadsCollection, where("users", "==", uid));
        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
            threads.push({
                id: doc.id,
                name: doc.data().name,
                messages: doc.data().messages as ChatCompletionRequestMessage[]
            });
        });

        return threads;
    }

	async function loadTranscriptions () {
		let transcriptions : any[] = [];
		console.log("Loading transcriptions for user: " + uid)
		const q = query(transcriptionsCollection, where("user", "==", uid));
		const snapshot = await getDocs(q);

		snapshot.forEach((doc) => {
			transcriptions.push({
				id: doc.id,
				name: doc.data().name,
				text: doc.data().text,

			});
		});

		return transcriptions;
	}

	let currThreadID: string = ''

	let chat : Chat;
	let threads: Threads

	const handleThreadSwitch = async (e: any) => {
		currThreadID = e.detail.threadID
		pageType = 'chat'
		
		try{
			await chat.getThread(currThreadID).then(()=>{
				chat.scrollToBottom()
			})
		}catch(e){
		}
	}

	async function handleThreadAdd(e: any) {
		console.log('handleThreadAdd')
		pageType = 'chat'
		allThreads = await loadThreads()
		currThreadID = e.detail.threadID
	}

	async function handleThreadDelete(e: any) {
		console.log('handleThreadDelete')
		currThreadID = ''
		pageType = 'chat'
		allThreads = await loadThreads()
		await chat.getThread("")
	}

	let transcribe : Transcribe
	let transcriptions : Transcriptions

	const handleTranscriptionSwitch = async (e: any) => {
		currThreadID = e.detail.transcriptionId
		pageType = 'transcribe'
		await transcribe.getTranscription(currThreadID)
	}

	async function handleTranscriptionAdd(e: any) {
		console.log('handleTranscriptionAdd')
		currThreadID = e.detail.id
		pageType = 'transcribe'
		allTranscriptions = await loadTranscriptions()
	}

	async function handleTranscriptionDelete(e: any) {
		console.log('handleTranscriptionDelete')
		currThreadID = ''
		pageType = 'transcribe'
		allTranscriptions = await loadTranscriptions()
	}
	
	async function handleNew(e:any){
		currThreadID = e.detail.id
		pageType = e.detail.pageType

		if(pageType == 'chat'){
			await chat.getThread("").then(()=>{
				chat.scrollToBottom()
			})
		}else if(pageType == 'transcribe'){
			await transcribe.getTranscription("")
		}
	}
</script>

<div class={"drawer h-[100svh] max-h-[100svh] " + (loggedIn ? " drawer-mobile" : "")}>
	<input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content max-h-[100svh] flex flex-col relative">
		<div class="w-full navbar bg-base-100">
			<div class="flex-none">
				<label for="my-drawer-2">
					<div class="btn btn-ghost btn-square">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="inline-block w-5 h-5 stroke-base-content"
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
				<span class="btn btn-ghost normal-case text-xl  text-base-content ">ScuffedGPT</span>
				
			</div>
			
			<label class="swap swap-rotate">
  
				<!-- this hidden checkbox controls the state -->
				<input type="checkbox" data-toggle-theme="dark,light" />
				
				<!-- sun icon -->
				<svg class="swap-off fill-base-content w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
				
				<!-- moon icon -->
				<svg class="swap-on fill-base-content w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
				
			  </label>
		</div>
		{#if loggedIn}
			{#if pageType == 'chat'}
				<Chat
					threadID={currThreadID}
					on:updatedoc={handleThreadAdd}
					on:adddoc={handleThreadAdd}
					bind:this={chat}
				/>
			{:else if pageType == "transcribe"}
				<Transcribe
					on:transcriptionNew={handleTranscriptionAdd}
					on:transcriptionUpdate={handleTranscriptionAdd}
					transcriptionId={currThreadID}
					bind:this={transcribe}
				/>
			{/if}
		{:else}
			<div class="h-full w-100 grow flex items-center place-self-center">
				<LoginBlock />
			</div>
		{/if}
	</div>
	<div class="drawer-side shadow-lg">
		<label for="my-drawer-2" class="drawer-overlay" />
		<ul class="menu p-4 w-80 bg-base-300 text-base-content gap-4">
			<!-- Sidebar content here -->

			{#if loggedIn}
				<form on:submit|preventDefault={() => handleLogout()}>
					<button type="submit" class="btn btn-primary w-full">Logout</button>
				</form>
				<Transcriptions
					on:transcriptionSwitch={handleTranscriptionSwitch}
					on:transcriptionNew={handleTranscriptionAdd}
					on:transcriptionDelete={handleTranscriptionDelete}
					on:onNewThread={handleNew}
					bind:this={transcriptions}
					currTranscriptionID={currThreadID}
					transcriptions={allTranscriptions}
				/>
				<Threads
					on:threadswitch={handleThreadSwitch}
					on:threadswitchNew={handleThreadSwitch}
					on:threaddelete={handleThreadDelete}
					on:onNewThread={handleNew}
					bind:this={threads}
					threads={allThreads}
					currThreadID={currThreadID}
				/>
			{/if}
		</ul>
	</div>
</div>
