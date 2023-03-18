<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import type { ChatCompletionRequestMessage  } from 'openai'
	import { SSE } from 'sse.js'

    import { getFirestore, addDoc, setDoc, doc, getDoc } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'

    import {threadsCollection} from "../../firebase"
	import { updated } from '$app/stores'

	import {createEventDispatcher} from 'svelte';
	import { onMount } from 'svelte'
	import { getTokens, getTotalTokens } from '$lib/tokenizer'

    export let threadID = ""
	let threadname = ""
	let chatMessages: ChatCompletionRequestMessage[] = []
	let loading: boolean = false

	let fetching: boolean = false

	let chatQuery: string = ''
	let answer: string = ''
    let firestore = getFirestore()
    let auth = getAuth()
	let scrollToDiv: HTMLDivElement

	$: threadID != "" && 
		getThread(threadID).then(() => {
			scrollToBottom()
	})

	$: threadID == "" && (
		chatMessages = [],
		threadname = ""
	)
	

	const dispatch = createEventDispatcher();

	export function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}

	const handleSubmit = async () => {
		if(chatQuery.trim() === "") return

		loading = true
		chatMessages = [...chatMessages, { role: 'user', content: chatQuery }]

		const eventSource = new SSE('/api/chat', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ messages: chatMessages })
		})

		const promptToken = getTokens(chatQuery)

		chatQuery = ''

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', async (e) => {
			scrollToBottom()
			try {
				loading = false
				if (e.data === '[DONE]') {
					console.log(e);
					chatMessages = [...chatMessages, { role: 'assistant', content: answer }]

					const ansToken = await getTokens(answer)

					answer = ''

                    await updateDb();


					dispatch("chatUpdate", {
						tokensUsed: promptToken + ansToken,
					});

					return
				}
				
				const completionResponse = JSON.parse(e.data)
				const [{ delta }] = completionResponse.choices
				
				if (delta.content) {
					answer = (answer ?? '') + delta.content
				}
			} catch (err) {
				handleError(err)
			}
		})
		eventSource.stream()
		scrollToBottom()
	}

	function handleError<T>(err: T) {
		loading = false
		chatQuery = ''
		answer = ''
		console.error(err)
	}

    async function updateDb(){
        if(threadID != ""){
            await setDoc(doc(firestore, "Threads", threadID), {
                name: threadname,
                messages: chatMessages,
                users: auth.currentUser!!.uid
            })

			dispatch("updatedoc", {
				threadID: threadID,
			});
        }else{
            await addDoc(threadsCollection, {
                name: threadname,
                messages: chatMessages,
                users: auth.currentUser!!.uid
            }).then((docRef) => {
                threadID = docRef.id

				dispatch("adddoc", {
					threadID: threadID,
				});
            })
        }
    }

	export async function getThread(threadId: string){
		fetching = true;
		getDoc(doc(firestore, "Threads", threadId)).then((doc) => {
			if (doc.exists()) {
				threadname = doc.data()!!.name
				chatMessages = doc.data()!!.messages
				fetching = false
			}
		}).catch((error) => {
			console.log("Error getting document:", error);
		});
	}

</script>
<div class="flex flex-col w-full px-4 pb-4 items-center gap-4 grow max-h-full relative h-[0px]">
	<div class="navbar bg-base-200 shadow-lg rounded-md gap-4"> 
            
		<div class="form-control grow shadow-inner">
			<div class="input-group">
			  <input 
				type="text" 
				placeholder="Unnamed thread" 
				class="input w-full text-base-content"
				bind:value={threadname}
				/>
			  <button class="btn btn-secondary" on:click={async ()=>{
				await updateDb()
			  }}>
				Submit
			  </button>
			</div>
		</div>
		
		<label class="swap">
			<input type="checkbox" />
			<div class="btn btn-accent break-keep swap-off">
				{getTotalTokens(chatMessages)} tokens
			</div>
			<div class="btn btn-accent break-keep swap-on">
				${(getTotalTokens(chatMessages)/1000 * 0.002).toFixed(4)}
			</div>
		</label>
	</div>
	<div class="w-full bg-base-300 rounded-md overflow-y-auto flex flex-col grow">
		<div class="flex flex-col">
			
		{#if fetching}
			<progress class="progress progress-primary w-full place-items-center"></progress>
		{:else}
			{#each chatMessages as message}
				<ChatMessage 
				type={message.role} 
				message={message.content} 
				user= {auth.currentUser}
				/>
			{/each}
			{#if answer != ""}
			<ChatMessage 
				type="assistant" 
				message={answer} 
				loading={loading} 
				user= {auth.currentUser}
				/>
			{/if}
		{/if}
		</div>
		<div class="" bind:this={scrollToDiv} />
	</div>
	<form
		class="flex w-full items-stretch rounded-md gap-4 bg-base-300 p-4"
		on:submit|preventDefault={() => handleSubmit()}
	>
		<input class="input input-bordered w-full text-base-content" bind:value={chatQuery} />
		{#if loading}
			<button type="submit" class="btn btn-primary" disabled>
				Loading...
			</button>
		{:else}
			<button type="submit" class="btn btn-primary">Send</button>
		{/if}
	</form>
</div>