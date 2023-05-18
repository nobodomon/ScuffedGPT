<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import BookmarkModal from '$lib/components/BookmarkModal.svelte'
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdBookmarkBorder from 'svelte-icons/md/MdBookmarkBorder.svelte'
	import MdStop from 'svelte-icons/md/MdStop.svelte'
	import MdSave from 'svelte-icons/md/MdSave.svelte'
	import MdInfo from 'svelte-icons/md/MdInfo.svelte'
	import type { ChatCompletionRequestMessage  } from 'openai'
	import { SSE } from 'sse.js'

    import { getFirestore, addDoc, setDoc, doc, getDoc, Timestamp, serverTimestamp, query, increment } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'

    import {imageThreadsCollection} from "../../firebase"
	import { updated } from '$app/stores'

	import {createEventDispatcher} from 'svelte';
	import { onMount } from 'svelte'
	import { getTokens, getTotalImageCost, getTotalTokens } from '$lib/tokenizer'
	import TextRecognition from './TextRecognition.svelte'
	import { parse } from 'postcss'
	import ImageMessage from './ImageMessage.svelte'

    export let threadID = ""
	let threadname = ""

	let results : any[] = []

    let prompt = ""
    let n = "1"
    let size = "256x256"

	let bookmarks: any[] = []
	let loading: boolean = false
	let inProgress: boolean = false

	let fetching: boolean = false

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
		results = [],
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
		if(prompt.trim() === "") return
		if(inProgress) return
		loading = true
		inProgress = true

		results = [...results,{
			data: prompt,
			size: size,
			n: n,
			role: "user"
		}]

		const formData = new FormData();

            //console.log(files.accepted[i])

		formData.append('prompt', prompt);
		formData.append('n', n);
		formData.append('size', size);

        const eventSource = await fetch('/api/dalle',{
            method: 'POST',
            body: formData
        }).then(res => res.json())


		console.log(eventSource);

		

		eventSource['role'] = "ai"

		results = [...results, eventSource]


        await updateDb();
        await updateTokenUsed();

        
		scrollToBottom()
	}

	function handleError<T>(err: T) {
		loading = false
		answer = ''
		console.error(err)
	}

    async function updateDb(){
        if(threadID != ""){
            await setDoc(doc(firestore, "ImageThreads", threadID), {
                name: threadname,
                results: results,
                users: auth.currentUser!!.uid,
				bookmarks: bookmarks,
				createdOn: serverTimestamp(),
				updatedOn: serverTimestamp(),
            },{merge: true})
        }else{
            await addDoc(imageThreadsCollection, {
                name: threadname,
                results: results,
                users: auth.currentUser!!.uid,
				bookmarks: bookmarks,
				updatedOn: serverTimestamp(),
            }).then((docRef) => {
                threadID = docRef.id

				dispatch("adddoc", {
					threadID: threadID,
				});
            })
        }
    }

	async function updateTokenUsed(){
		const userRef = doc(firestore, "Users", auth.currentUser!!.uid);

        switch(size) {
            case "256x256": 
                await setDoc(userRef, {
                    "256x256": increment(1)
                    }, {merge: true})
                prompt = "";
                n = "1";
                size = "256x256";
                break;

            case "512x512":
                await setDoc(userRef, {
                    "512x512": increment(1)
                    }, {merge: true})
                prompt = "";
                n = "1";
                size = "256x256";
                break;

            case "1024x1024":
                await setDoc(userRef, {
                    "1024x1024": increment(1)
                    }, {merge: true})
                prompt = "";
                n = "1";
                size = "256x256";
                break;

            default:{
                return;
            }
        }
	}

	export async function getThread(threadId: string){
		fetching = true;
		getDoc(doc(firestore, "ImageThreads", threadId)).then((doc) => {
			if (doc.exists()) {
				threadname = doc.data()!!.name
				results = doc.data()!!.results
				bookmarks = doc.data()!!.bookmarks ? doc.data()!!.bookmarks.sort((a:any,b: any)=> a.index > b.index) : []
				systemMessage = doc.data()!!.systemMessage ? doc.data()!!.systemMessage : ""
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
		prompt = prompt + e.detail.text
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
			setTimeout(function () {
				element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
			}, 100)
		}
	}

	function sortBookmarks(bookmarks: any){
		return bookmarks.sort((a: any, b: any) => a.index > b.index)
	}

	function getImagesCost(results: any){
		const images = getTotalImageCost(results);
		let total = 0;

		total += images["s_count"] * 0.016;
		total += images["m_count"] * 0.018;
		total += images["l_count"] * 0.02;

		return total;
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
			  <div class="w-5">
				<MdSave />
			</div>	
			  </button>
			</div>
		</div>
		
		<label class="swap">
			<input type="checkbox" />
			<div class="btn btn-accent break-keep swap-off">
				
				${getImagesCost(results)}
			</div>
			<div class="btn btn-accent break-keep swap-on">
				<!-- ${(getTotalTokens(chatMessages)/1000 * 0.002).toFixed(4)} -->
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
	<div class={"w-full bg-base-300 rounded-md overflow-y-auto flex flex-col grow " + (answer != "" || fetching ? "animate-pulse" : "")}>
		<div class="flex flex-col relative">
			
		{#if fetching}
		<div class="toast toast-center toast-middle">
			<div class="alert">
				<div>
					<button class="btn btn-square loading"></button>
				</div>
			</div>
		</div>
		{:else}
			
			{#each results as message, index}
				<ImageMessage 
				type={message.role} 
				message={message.data} 
				user= {auth.currentUser}
				index = {index}
				bookmarked = {bookmarks.find((item) => item.index == index) ? true : false}
				on:bookmark={updateBookmark}
				/>
			{/each}
			<!-- {#if message.data.length > 0}
			<ChatMessage 
				type="assistant" 
				message={answer} 
				loading={loading} 
				user= {auth.currentUser}
				index = {-1}
				bookmarked = {false}
				/>
			{/if} -->
		{/if}
		</div>
		<div class="" bind:this={scrollToDiv} />

	</div>
	<div class="flex w-full items-stretch rounded-md gap-4 bg-base-300 p-4">
		<div class="form-control w-full max-w-xs">
			<label class="label">
			  <span class="label-text">Number of images?</span>
			</label>
			<input type="number" placeholder="Number of images" bind:value={n} class="input input-bordered input-primary w-full max-w-xs" />
		</div>
		<div class="form-control w-full max-w-xs">
			<label class="label">
			  <span class="label-text">Image Size</span>
			</label>
			<select class="select select-bordered select-primary" bind:value={size}>
			  <option value="256x256">256x256</option>
			  <option value="512x512">512x512</option>
			  <option value="1024x1024">1024x1024</option>
			</select>
		  </div>
	</div>
	<form
		class="flex w-full items-stretch rounded-md gap-4 bg-base-300 p-4"
		on:submit|preventDefault={() => handleSubmit()}
	>
		<textarea class="textarea textarea-xs text-sm max-h-48 w-full text-base-content" on:keypress={handleInput} on:paste={detectImg} bind:value={prompt} />
		{#if inProgress}
			<button type="submit" class="btn btn-primary btn-square loading" disabled>
			</button>
		{:else if prompt == ""}
			<button type="submit" class="btn btn-primary" disabled>Send</button>
		{:else}
			<button type="submit" class="btn btn-primary">Send</button>
		{/if}
	</form>

	<BookmarkModal showModal={showBookmarkModal} index={index} on:saveBookmark={saveBookmark} on:closeModal={closeBookmarkModal}/>
</div>