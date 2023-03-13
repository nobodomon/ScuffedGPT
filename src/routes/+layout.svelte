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

<div class="drawer drawer-mobile h-[100svh] max-h-[100svh]">
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
			{#if pageType == 'chat'}
				<Chat
					threadID={currThreadID}
					on:updatedoc={handleThreadAdd}
					on:adddoc={handleThreadAdd}
					bind:this={chat}
				/>
			{:else if pageType == "transcribe"}
				<Transcribe
					on:transcriptionNew{handleTranscriptionAdd}
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
	<div class="drawer-side">
		<label for="my-drawer-2" class="drawer-overlay" />
		<ul class="menu p-4 w-80 bg-base-100 text-base-content gap-4">
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
