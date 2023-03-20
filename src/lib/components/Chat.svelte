<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import BookmarkModal from '$lib/components/BookmarkModal.svelte'
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdSave from 'svelte-icons/md/MdSave.svelte'
	import type { ChatCompletionRequestMessage  } from 'openai'
	import { SSE } from 'sse.js'

    import { getFirestore, addDoc, setDoc, doc, getDoc } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'

    import {threadsCollection} from "../../firebase"
	import { updated } from '$app/stores'

	import {createEventDispatcher} from 'svelte';
	import { onMount } from 'svelte'
	import { getTokens, getTotalTokens } from '$lib/tokenizer'
	import TextRecognition from './TextRecognition.svelte'

    export let threadID = ""
	let threadname = ""
	let chatMessages: ChatCompletionRequestMessage[] = []
	let bookmarks: any[] = []
	let loading: boolean = false

	let fetching: boolean = false

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

		//Send last 3 of chatmessages

		const gptPayload = chatMessages.slice(-3)

		const eventSource = new SSE('/api/chat', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ messages: gptPayload })
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
                users: auth.currentUser!!.uid,
				bookmarks: bookmarks
            })

			dispatch("updatedoc", {
				threadID: threadID,
			});
        }else{
            await addDoc(threadsCollection, {
                name: threadname,
                messages: chatMessages,
                users: auth.currentUser!!.uid,
				bookmarks: bookmarks
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
				bookmarks = doc.data()!!.bookmarks ? doc.data()!!.bookmarks.sort((a:any,b: any)=> a.index > b.index) : []
				fetching = false
			}
		}).catch((error) => {
			console.log("Error getting document:", error);
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
					image = reader.result
					showTextRecognition = true
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
		showBookmarkModal = false
	}

	function closeBookmarkModal(){
		showBookmarkModal = false
		index = -1
	}


	const scrollToBookmark = (index: number) => {
		const element = document.getElementById(`bookmark-${index}`)
		if(element){
			element.scrollIntoView({ behavior: 'smooth', block: 'center' })
		}
	}

	function sortBookmarks(bookmarks: any){
		return bookmarks.sort((a: any, b: any) => a.index > b.index)
	}

</script>
<div class="flex flex-col w-full px-4 pb-4 items-center gap-4 grow max-h-full relative h-[0px]">
	<div class="navbar bg-base-200 shadow-lg rounded-md gap-4"> 
            
		<div class="flex-1 gap-4">
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
					${(getTotalTokens(chatMessages)/1000 * 0.002).toFixed(4)}
				</div>
			</label>
		</div>
		<div class="dropdown dropdown-bottom dropdown-end">
			<label tabindex="0" class="btn m-1">
				<div class="w-5">
					<MdBookmark />
				</div>
			</label>
			<ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
				{#each sortBookmarks(bookmarks) as bookmark}
				<li class="w-full" on:click={()=>{scrollToBookmark(bookmark.index)}}><a>{bookmark.name}</a></li>
			{/each}
			</ul>
		  </div>
	</div>
	<div class="w-full bg-base-300 rounded-md overflow-y-auto flex flex-col grow">
		<div class="flex flex-col">
			
		{#if fetching}
			<progress class="progress progress-primary w-full place-items-center"></progress>
		{:else}
			{#each chatMessages as message, index}
				<ChatMessage 
				type={message.role} 
				message={message.content} 
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
		class="flex w-full items-stretch rounded-md gap-4 bg-base-300 p-4"
		on:submit|preventDefault={() => handleSubmit()}
	>
		<textarea class="textarea textarea-xs max-h-48 w-full text-base-content" on:keypress={handleInput} on:paste={detectImg} bind:value={chatQuery} />
		{#if loading}
			<button type="submit" class="btn btn-primary" disabled>
				Loading...
			</button>
		{:else}
			<button type="submit" class="btn btn-primary">Send</button>
		{/if}
	</form>

	<TextRecognition showModal={showTextRecognition} image={image} on:closeModal={closeModal} on:useAsPrompt={appendPrompt}>

	</TextRecognition>

	<BookmarkModal showModal={showBookmarkModal} index={index} on:saveBookmark={saveBookmark} on:closeModal={closeBookmarkModal}>
	</BookmarkModal>
</div>