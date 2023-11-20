<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import BookmarkModal from '$lib/components/BookmarkModal.svelte'
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdBookmarkBorder from 'svelte-icons/md/MdBookmarkBorder.svelte'
	import MdStop from 'svelte-icons/md/MdStop.svelte'
	import MdSave from 'svelte-icons/md/MdSave.svelte'
	import MdInfo from 'svelte-icons/md/MdInfo.svelte'
	import type { ChatCompletionRequestMessage  } from 'openai'
	import type {ChatMessageWrapper} from '$lib/ChatMessageWrapper'
	import { SSE } from 'sse.js'

    import { getFirestore, addDoc, setDoc, doc, getDoc, Timestamp, serverTimestamp, query, increment, onSnapshot } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'

    import {threadsCollection} from "../../firebase"
	import { updated } from '$app/stores'

	import {createEventDispatcher} from 'svelte';
	import { onMount } from 'svelte'
	import { getTokens, getTotalTokens } from '$lib/tokenizer'
	import { updateTokenUsed } from '$lib/token'
	import TextRecognition from './TextRecognition.svelte'

    export let threadID = ""
	let threadname = ""
	let chatMessages: ChatMessageWrapper[] = []
	let bookmarks: any[] = []
	let users: any[] = []
	let errors: any[] = []
	let loading: boolean = false
	let inProgress: boolean = false

	let fetching: boolean = false

	let model: string = 'gpt-3.5-turbo'
	let systemMessage: string = ''
	let chatQuery: string = ''

	let showTextRecognition: boolean = false
	let showBookmarkModal: boolean = false
	let answer: string = ''
    let firestore = getFirestore()
    let auth = getAuth()
	let scrollToDiv: HTMLDivElement

	let image: File
	let index: number = -1
	
	$: threadID != "" && 
		getThread(threadID).then(() => {
			scrollToBottom()
	})

	$: threadID == "" && (
		chatMessages = [],
		threadname = "",
		bookmarks = []
	)
	

	const dispatch = createEventDispatcher();

	export function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}

	const handleSubmit = async () => {
		if(chatQuery.trim() === "") return
		if(inProgress) return
		loading = true
		inProgress = true

		const newPrompt = { 
			role: 'user', 
			content: chatQuery ,
			name: auth.currentUser!!.displayName ?? undefined,
			profilePic: auth.currentUser?.photoURL ?? undefined
		}
		chatMessages = [...chatMessages, newPrompt]

		//Send last 3 of chatmessages

		const gptPayload = structuredClone(chatMessages.slice(-9))

		gptPayload.forEach((item)=>{
			delete item.profilePic;
			delete item.name
		})
		

		const eventSource = new SSE('/api/chat', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ 
				messages: gptPayload, 
				systemMessage: systemMessage,
				model: model
			}),
			method: 'POST'
		})

		const promptToken = getTokens(chatQuery)

		chatQuery = ''

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', async (e) => {
			try {
				loading = false
				if (e.data === '[DONE]') {
					inProgress = false
					console.log(e);
					chatMessages = [...chatMessages, { role: 'assistant',name:'ScuffedGPT', content: answer }]

					const ansToken = await getTokens(answer)

					answer = ''

                    await updateDb();
					await updateTokenUsed({
						prompt: promptToken,
						answer: ansToken,
					},model, undefined);
					scrollToBottom()
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
		inProgress = false
		chatQuery = ''
		answer = ''
		console.error(err)
		errors = [...errors, err]
	}

	function dismissError(index: number) {
		errors = errors.filter((_, i) => i !== index)
	}

    async function updateDb(){

		if(users.indexOf(auth.currentUser!!.uid) == -1){
			users.push(auth.currentUser!!.uid)
		}

        if(threadID != ""){
            await setDoc(doc(firestore, "Threads", threadID), {
                name: threadname,
                messages: chatMessages,
				model: model,
                users: users,
				bookmarks: bookmarks,
				createdOn: serverTimestamp(),
				updatedOn: serverTimestamp(),
				systemMessage: systemMessage
            },{merge: true})
        }else{
            await addDoc(threadsCollection, {
                name: threadname,
                messages: chatMessages,
				model: model,
                users: users,
				bookmarks: bookmarks,
				updatedOn: serverTimestamp(),
				systemMessage: systemMessage
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
		onSnapshot(doc(firestore, "Threads", threadId), (doc) => {
			
			threadname = doc.data()!!.name
			chatMessages = doc.data()!!.messages
			model = doc.data()!!.model
			users = typeof doc.data()!!.users == 'string' ? [doc.data()!!.users] : doc.data()!!.users
			bookmarks = doc.data()!!.bookmarks ? doc.data()!!.bookmarks.sort((a:any,b: any)=> a.index > b.index) : []
			systemMessage = doc.data()!!.systemMessage ? doc.data()!!.systemMessage : ""
			fetching = false

			scrollToBottom()
		});
	}

	async function detectImg(e: ClipboardEvent){
		if (e.clipboardData) {
			const items = e.clipboardData.items;
			if (items) {
			let file: File | null = null;
			for (let i = 0; i < items.length; i++) {
				if (items[i].type.indexOf('image') !== -1) {
				// Image is pasted, handle it here
				file = items[i].getAsFile();
				console.log(file)
				await read(file).then((reader) => {
					image = reader.result
					showTextRecognition = true
					document.getElementById("textRecognitionModal")?.showModal();
				})
				}
			}
			}
			// If items array does not exist, check for files array
			else {
			const files = e.clipboardData.files;
			if (files.length > 0) {
				// Files are pasted, check if an image is present and handle it accordingly
				const imageFile = Array.from(files).find((file) => file.type.indexOf('image') !== -1);
				if (imageFile) {
				// Image is pasted, handle it here
				await read(imageFile).then((reader) => {
					image = reader.result;

					showTextRecognition = true
					document.getElementById("textRecognitionModal")?.showModal();
				})
				}
			}
			}
		}
	}

	async function read (file: any) {
        return new Promise<any>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

	function closeModal(){
		showTextRecognition = false
	}

	function appendPrompt(e: any){
		chatQuery = chatQuery + e.detail.text
		showTextRecognition = false
	}

	function handleInput(e: any){
		if(e.key == "Enter" && !e.shiftKey){
			e.preventDefault()
			handleSubmit()
		}
	}

	async function updateBookmark(e: any){
		if(bookmarks.find((item) => item.index == e.detail.index)){
			bookmarks = bookmarks.filter((item) => item.index != e.detail.index)
			await updateDb()
		}else{
			showBookmarkModal = true
			document.getElementById('bookmarkModal')?.showModal();
			index = e.detail.index
		}
	}

	async function saveBookmark(e: any){

		bookmarks.push({
			index: e.detail.index,
			name: e.detail.name
		})
		bookmarks = bookmarks

		await updateDb()
		document.getElementById('bookmarkModal')?.close();
		showBookmarkModal = false;
	}

	function closeBookmarkModal(){
		document.getElementById('bookmarkModal')?.close();
		showBookmarkModal = false
		index = -1
	}


	const scrollToBookmark = (index: number) => {
		
		
		const element = document.getElementById(`bookmark-${index}`)
		if(element){
			setTimeout(function () {
				element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
			}, 100)
		}
	}

	function sortBookmarks(bookmarks: any){
		return bookmarks.sort((a: any, b: any) => a.index > b.index)
	}

</script>
<div class="flex flex-col w-full px-4 pb-4 items-stretch gap-4 grow max-h-full relative h-[0px]">
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
			  <div class="w-5">
				<MdSave />
			</div>	
			  </button>
			</div>
		</div>
		
		<label class="swap">
			<input type="checkbox" />
			<div class="btn btn-accent break-keep swap-off">
				{getTotalTokens(chatMessages)} tokens
			</div>
			<div class="btn btn-accent break-keep swap-on">
				${(getTotalTokens(chatMessages)/1000 * 0.0015).toFixed(4)}
			</div>
		</label>
		{#if bookmarks.length > 0}
		<div class="dropdown dropdown-bottom dropdown-end">
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="0" class="btn btn-square">
				<div class="w-5">
						<MdBookmark />
				</div>
			</label>
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<ul tabindex="0" class="dropdown-content menu p-2 mt-2 shadow bg-base-100 rounded-box w-52">
				{#each sortBookmarks(bookmarks) as bookmark}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-missing-attribute -->
					<li class="w-full text-base-content" on:click={()=>{scrollToBookmark(bookmark.index)}}><a>{bookmark.name}</a></li>
				{/each}
			</ul>
		</div>
		{/if}
	</div>
	<div class={" bg-base-300 rounded-md overflow-y-auto flex flex-col grow " + (answer != "" || fetching ? "animate-pulse" : "")}>
		<div class="flex flex-col relative">
		
		{#if fetching}
			<div class="p-4 flex flex-col items-center justify-center">
				
				<span class="loading loading-spinner loading-lg"></span>
			</div>
		{:else}
			{#if threadID == ""}
			<div class="p-4 flex gap-4">
				<div class="form-control grow">
					<div class="input-group">
						<input type="text" bind:value={systemMessage} class="input w-full" placeholder="Provide a system message... (optional)"/>
						<div class="tooltip tooltip-bottom before:-left-[235%]" data-tip="Provide a system message to get more related results. E.g. You are a software requirements engineer, always prompt me for missing information and when asked for diagrams output it in plantuml">
							<button class="btn btn-square rounded-l-none">
								<div class="w-5">
									<MdInfo />
								</div>
							</button>
						</div>
					</div>
				  </div>
				  
				  <select bind:value={model} class="select shrink">
					<option selected value={'gpt-3.5-turbo-1106'}>GPT 3.5 Turbo</option>
					<option value={'gpt-4-1106-preview'}>GPT 4-Turbo</option>
				  </select>
			</div>
			{/if}
			{#each chatMessages as message, index}
				<ChatMessage 
				type={message.role} 
				message={message.content} 
				profilePic={message.profilePic}
				name= {message.name}
				user= {auth.currentUser}
				index = {index}
				bookmarked = {bookmarks.find((item) => item.index == index) ? true : false}
				on:bookmark={updateBookmark}
				/>
			{/each}
			{#if answer != ""}
			<ChatMessage 
				type="assistant" 
				message={answer} 
				name={'ScuffedGPT'}
				profilePic={undefined}
				loading={loading} 
				user= {auth.currentUser}
				index = {-1}
				bookmarked = {false}
				/>
			{/if}
		{/if}
		</div>
		<div class="" bind:this={scrollToDiv} />

	</div>
	<form
		class="flex items-stretch rounded-md gap-4 bg-base-300 p-4"
		on:submit|preventDefault={() => handleSubmit()}
	>
		<textarea class="textarea textarea-xs text-sm max-h-48 w-full text-base-content" on:keypress={handleInput} on:paste={detectImg} bind:value={chatQuery} />
		{#if inProgress}
			<button type="submit" class="btn btn-primary btn-square loading" disabled>
			</button>
		{:else if chatQuery == ""}
			<button type="submit" class="btn btn-primary" disabled>Send</button>
		{:else}
			<button type="submit" class="btn btn-primary">Send</button>
		{/if}
	</form>

	<TextRecognition showModal={showTextRecognition} image={image} on:closeModal={closeModal} on:useAsPrompt={appendPrompt}/>

	<BookmarkModal showModal={showBookmarkModal} index={index} on:saveBookmark={saveBookmark} on:closeModal={closeBookmarkModal}/>
	<div class="toast toast-top toast-center">
		{#each errors as error, index}
			<div class="alert alert-error">
				There was problem with the request. Please try again.
				<button class="btn btn-circle btn-xs btn-ghost" on:click={()=>{dismissError(index)}}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="w-6 h-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				  </button>
			</div>
		{/each}
	</div>
</div>