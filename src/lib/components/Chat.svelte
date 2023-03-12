<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { SSE } from 'sse.js'

    import { getFirestore, collection, addDoc, setDoc, doc, query,where } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'

    import {threadsCollection} from "../../firebase"
	import { updated } from '$app/stores'

	import {createEventDispatcher} from 'svelte';

	let chatQuery: string = ''
	let answer: string = ''
	let loading: boolean = false
	export let chatMessages: ChatCompletionRequestMessage[]
	let scrollToDiv: HTMLDivElement

    let firestore = getFirestore()
    let auth = getAuth()

    export let threadname = ""
    export let threadID = ""

	const dispatch = createEventDispatcher();
    

	function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}

	const handleSubmit = async () => {
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
					chatMessages = [...chatMessages, { role: 'assistant', content: answer }]
					answer = ''
					
                    await updateDb();
					loading = false
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

			dispatch("threadswitch", {
				threadID: threadID,
				threadName: threadname,
				messages: chatMessages
			});
        }else{
            await addDoc(threadsCollection, {
                name: threadname,
                messages: chatMessages,
                users: auth.currentUser!!.uid
            }).then((docRef) => {
                threadID = docRef.id

				dispatch("threadswitch", {
					threadID: threadID,
					threadName: threadname,
					messages: chatMessages
				});
            })
        }
    }
	

</script>

<div class="flex flex-col py-4 w-full px-8 items-center gap-2 h-[100vh]">
	<div class="form-control w-full">
        <div class="input-group">
          <input 
            type="text" 
            placeholder="Unnamed thread" 
            class="input w-full input-bordered"
            bind:value={threadname}
            />
          <button class="btn btn-primary" on:click={updateDb}>
            Submit
          </button>
        </div>
      </div>
	<div class="h-[100%] w-full bg-gray-900 rounded-md p-4 overflow-y-auto flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			{#each chatMessages as message}
				<ChatMessage type={message.role} message={message.content} />
			{/each}
			{#if answer}
				<ChatMessage type="assistant" message={answer} />
			{/if}
			{#if loading}
				<ChatMessage type="assistant" message="Loading.." />
			{/if}
		</div>
		<div class="" bind:this={scrollToDiv} />
	</div>
	<form
		class="flex w-full rounded-md gap-4 bg-gray-900 p-4"
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
