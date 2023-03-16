<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { SSE } from 'sse.js'

    import { getFirestore, addDoc, setDoc, doc, getDoc } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'

    import {threadsCollection} from "../../firebase"
	import { updated } from '$app/stores'

	import {createEventDispatcher} from 'svelte';
	import { onMount } from 'svelte'

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
	
	onMount(async () => {
		await getThread(threadID)
		scrollToBottom()
	})


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

		chatQuery = ''

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', async (e) => {
			scrollToBottom()
			try {
				if (e.data === '[DONE]') {
					console.log(e);
					chatMessages = [...chatMessages, { role: 'assistant', content: answer }]
					answer = ''

                    await updateDb();
					loading = false
					return
				}
				
				const completionResponse = JSON.parse(e.data)
				console.log(completionResponse)
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
		if(threadId == ""){
			threadname = ""
			chatMessages = []
			fetching = false;
			return;
		}
		getDoc(doc(firestore, "Threads", threadId)).then((doc) => {
			if (doc.exists()) {
				threadname = doc.data()!!.name
				chatMessages = doc.data()!!.messages
				fetching = false
			} else {
				// doc.data() will be undefined in this case
				threadname = ""
				chatMessages = []
				fetching = false
			}
		}).catch((error) => {
			console.log("Error getting document:", error);
		});
	}
	
</script>
<div class="flex flex-col w-full px-4 pb-4 items-center gap-4 grow max-h-full relative h-[0px]">
	<div class="form-control w-full">
        <div class="input-group">
          <input 
            type="text" 
            placeholder="Unnamed thread" 
            class="input w-full input-bordered"
            bind:value={threadname}
            />
          <button class="btn btn-primary" on:click={async ()=>{
			await updateDb()
		  }}>
            Submit
          </button>
        </div>
    </div>
	<div class="w-full bg-base-300 rounded-md overflow-y-auto flex flex-col grow">
		<div class="flex flex-col">
			
		{#if fetching}
			<progress class="progress progress-primary w-56 place-items-center"></progress>
		{:else}
			{#each chatMessages as message}
				<ChatMessage 
				type={message.role} 
				message={message.content} 
				user= {auth.currentUser}
				/>
			{/each}
			{#if loading}
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
		class="flex w-full rounded-md gap-4 bg-base-300 p-4"
		on:submit|preventDefault={() => handleSubmit()}
	>
		<input type="text" class="input input-bordered w-full" bind:value={chatQuery} />
		{#if loading}
			<button type="submit" class="btn btn-primary" disabled>
				Loading...
			</button>
		{:else}
			<button type="submit" class="btn btn-primary">Send</button>
		{/if}
	</form>
</div>