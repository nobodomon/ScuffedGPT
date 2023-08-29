<script lang="ts">
	import LoginBlock from '$lib/components/LoginBlock.svelte'
	import '../app.css'
	import { auth,threadsCollection,transcriptionsCollection, userCollection } from '../firebase'
	import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
	//import Transcribe from '$lib/components/Transcribe.svelte'
	import Threads from '$lib/components/Threads.svelte'
	import ImageThreads from '$lib/components/ImageThreads.svelte'
	//import Chat from '$lib/components/Chat.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'

	import {getFirestore, onSnapshot,getDocs, deleteDoc, setDoc, doc, addDoc, query, where, increment, updateDoc, orderBy} from "firebase/firestore";
	import Transcriptions from '$lib/components/Transcriptions.svelte'
	import { onMount } from 'svelte'
	import { themeChange } from 'theme-change'
	import { getTokensFromAllThreads, getTotalTokens } from '$lib/tokenizer'
	import { toSeconds } from '../utils'

	let loggedIn: boolean = false
	let uid = ''
	let user = {}
	let allThreads : ChatCompletionRequestMessage[] = []
	let allTranscriptions : any[] = []

	let usedTokens = 0;
	let gpt4PromptTokensUsed = 0;
	let gpt4AnswerTokensUsed = 0;
	let totalDuration = 0;
	let s_count = 0;
	let m_count = 0;
	let l_count = 0;

	let totalCost = "";

	const firestore = getFirestore()

	auth.onAuthStateChanged( async (user) => {
		if (user) {
			// User is signed in, see docs for a list of available properties
			// https://firebase.google.com/docs/reference/js/firebase.User
			uid = user.uid
			user = user
			loggedIn = true

			const userTokens = doc(firestore, "Users", uid);

			onSnapshot(userTokens, (doc) => {
				if(doc.exists()){
					usedTokens = doc.data().tokensUsed? doc.data().tokensUsed : 0
					gpt4PromptTokensUsed = doc.data().gpt4PromptTokensUsed? doc.data().gpt4PromptTokensUsed : 0
					gpt4AnswerTokensUsed = doc.data().gpt4AnswerTokensUsed? doc.data().gpt4AnswerTokensUsed : 0
					totalDuration = doc.data().transcriptionTime? doc.data().transcriptionTime : 0
					s_count = doc.data()["256x256"]? doc.data()["256x256"] : 0
					m_count = doc.data()["512x512"]? doc.data()["512x512"] : 0
					l_count = doc.data()["1024x1024"]? doc.data()["1024x1024"] : 0
				
					totalCost = calculateTotalCost();
				}
			});
			
			// ...
		} else {
			// User is signed out
			// ...
			uid = ''
			user = null
			loggedIn = false
		}
	})

	const handleLogout = async () => {
		try {
			const auth = getAuth()
			await auth.signOut()
		} catch (error) {
			//console.log(error)
		}
	}

	onMount(()=>{
		themeChange(false);
	})

	function calculateTotalCost(){
		const durationCost = (totalDuration/60 * 0.006).toFixed(4);
		const tokenCost = (usedTokens/1000 * 0.0015).toFixed(4);
		const gpt4TokensCost = ((gpt4PromptTokensUsed/1000 * 0.003) + (gpt4AnswerTokensUsed/1000 * 0.006)).toFixed(4);
		const s_cost = (s_count * 0.016).toFixed(4);
		const m_cost = (m_count * 0.018).toFixed(4);
		const l_cost = (l_count * 0.02).toFixed(4);
		let total = (parseFloat(durationCost) + parseFloat(tokenCost) + parseFloat(gpt4TokensCost) + parseFloat(s_cost) + parseFloat(m_cost) + parseFloat(l_cost)).toFixed(4);
		return total;
	}
</script>

<svelte:head>
	<title>ScuffedGPT</title>
</svelte:head>


<div class={"drawer h-[100svh] max-h-[100svh] lg:drawer-open" + (loggedIn ? " drawer-mobile" : "")}>
	<input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content max-h-[100svh] flex flex-col relative">
		<div class="w-full navbar bg-base-100 gap-4">
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
				<a class="btn btn-ghost normal-case text-xl  text-base-content " href="/">ScuffedGPT</a>
				
			</div>
			
			{#if loggedIn}
			<form on:submit|preventDefault={() => handleLogout()} class="">
				<button type="submit" class="btn btn-ghost text-base-content w-full hover:bg-primary hover:text-primary-content">Logout</button>
			</form>
			{/if}
			
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
			<slot/>
		{:else}
			<div class="h-full w-100 grow flex items-center place-self-center">
				<LoginBlock />
			</div>
		{/if}
	</div>
	<div class="drawer-side shadow-lg">
		<label for="my-drawer-2" class="drawer-overlay" />
		<ul class="menu w-80 min-h-full bg-base-300 text-base-content gap-4">
			<!-- Sidebar content here -->

			{#if loggedIn}
				<div class="collapse bg-base-200 shadow-inner">
					<input type="checkbox" class="peer" /> 
					<div class="collapse-title text-primary-content">
						<div class="col-span-2 flex flex-col gap-4">
							<h1 class="text-sm text-secondary font-bold">Total estimated cost</h1>
							<h1 class="text-sm font-bold text-base-content">{totalCost} USD</h1>
							<h1 class="text-sm text-accent font-bold">Click here for usage breakdown</h1>
						</div>
					</div>
					<div class="collapse-content"> 
						<div class="grid grid-cols-2 grid-auto-fr gap-4">
							<h1 class="text-md text-secondary font-bold">Time</h1>
							<h1 class="text-md text-accent font-bold">Estimated cost</h1>
							<h1 class="text-sm ">{toSeconds(totalDuration,"mm[m] ss[s] SS[ms]")}</h1>
							<h1 class="text-sm ">{(totalDuration/60 * 0.006).toFixed(4)} USD</h1>
							<h1 class="text-md text-secondary font-bold">GPT3 tokens</h1>
							<h1 class="text-md text-accent font-bold">Estimated cost</h1>
							<h1 class="text-sm ">{usedTokens}</h1>
							<h1 class="text-sm ">{(usedTokens/1000 * 0.0015).toFixed(4)} USD</h1>
							<h1 class="text-md text-secondary font-bold">GPT4 Prompt tokens</h1>
							<h1 class="text-md text-accent font-bold">Estimated cost</h1>
							<h1 class="text-sm ">{gpt4PromptTokensUsed}</h1>
							<h1 class="text-sm ">{(gpt4PromptTokensUsed/1000 * 0.003).toFixed(4)} USD</h1>
							<h1 class="text-md text-secondary font-bold">GPT4 Answer tokens</h1>
							<h1 class="text-md text-accent font-bold">Estimated cost</h1>
							<h1 class="text-sm ">{gpt4AnswerTokensUsed}</h1>
							<h1 class="text-sm ">{(gpt4AnswerTokensUsed/1000 * 0.006).toFixed(4)} USD</h1>
							<h1 class="text-md text-secondary font-bold">Images Generated</h1>
							<h1 class="text-md text-accent font-bold">Estimated cost</h1>
							<h1 class="text-sm ">{s_count} x 256x256</h1>
							<h1 class="text-sm ">{(s_count * 0.016).toFixed(4)} USD</h1>
							<h1 class="text-sm ">{m_count} x 512x512</h1>
							<h1 class="text-sm ">{(m_count * 0.018).toFixed(4)} USD</h1>
							<h1 class="text-sm ">{l_count} x 1024x1024</h1>
							<h1 class="text-sm ">{(l_count * 0.02).toFixed(4)} USD</h1>
						</div>
					</div>
				  </div>
				<Transcriptions/>
				<Threads/>
				<ImageThreads/>
			{/if}
		</ul>
	</div>
</div>
