<script lang="ts">
	import BookmarkModal from '$lib/components/BookmarkModal.svelte'
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdSave from 'svelte-icons/md/MdSave.svelte'

    import { getFirestore, addDoc, setDoc, doc, getDoc, serverTimestamp} from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'

    import {imageThreadsCollection} from "../../firebase"

	import {createEventDispatcher} from 'svelte';
	import { getTotalImageCost } from '$lib/tokenizer'
	import ImageMessage from './ImageMessage.svelte'
	import { updateTokenUsed } from '$lib/token'

    export let threadID = ""
	let threadname = ""


	let results : any[] = []

	let model = "dall-e-2"
	let quality = "standard"
    let prompt = ""
    let n = "1"
    let size = "256x256"

	let bookmarks: any[] = []
	let loading: boolean = false

	let fetching: boolean = false

	let systemMessage: string = ''
	let chatQuery: string = ''

	let showTextRecognition: boolean = false
	let showBookmarkModal: boolean = false
	let answer: string = ''
    let firestore = getFirestore()
    let auth = getAuth()
	let scrollToDiv: HTMLDivElement

	let errors: any[] = []

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
		if(loading) return
		loading = true

		results = [...results,{
			data: prompt,
			role: "user"
		}]

		const formData = new FormData();

            //console.log(files.accepted[i])

		formData.append('prompt', prompt);
		formData.append('n', n);
		formData.append('size', size);
		formData.append('model', model);
		formData.append('quality', quality);


		const result = {
			role: 'assistant',
			size: size,
			n: n,
			quality: quality,
			data: undefined,
			created: undefined
		}

		prompt = ""

        const eventSource = await fetch('/api/dalle',{
            method: 'POST',
            body: formData
        }).then(response =>{
			return response.json()
		})

		if(eventSource.error){
			handleError(eventSource.error)
			return
		}

		console.log(eventSource);

		result['data'] = eventSource.data
		result['created'] = eventSource.created

		console.log(result);

		results = [...results, result]



        await updateDb();

		await updateTokenUsed(parseInt(n), model, {
			quality: quality,
			size: size
		})
		

		loading = false

		scrollToBottom()
	}

	function handleError<T>(err: T) {
		loading = false
		answer = ''
		console.error(err)
		errors = [...errors, err]
	}

	function dismissError(index: number) {
		errors = errors.filter((_, i) => i !== index)
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
				model: model,
            },{merge: true})
        }else{
            await addDoc(imageThreadsCollection, {
                name: threadname,
                results: results,
                users: auth.currentUser!!.uid,
				bookmarks: bookmarks,
				updatedOn: serverTimestamp(),
				model: model,
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
		getDoc(doc(firestore, "ImageThreads", threadId)).then((doc) => {
			if (doc.exists()) {
				threadname = doc.data()!!.name
				results = doc.data()!!.results
				bookmarks = doc.data()!!.bookmarks ? doc.data()!!.bookmarks.sort((a:any,b: any)=> a.index > b.index) : []
				systemMessage = doc.data()!!.systemMessage ? doc.data()!!.systemMessage : "",
				model= doc.data()!!.model ? doc.data()!!.model : "dall-e-2",
				fetching = false

				if(model == "dall-e-2"){
					size = "256x256"
				}

				if(model == "dall-e-3"){
					size = "1024x1024"
				}
			}
		}).catch((error) => {
			console.log("Error getting document:", error);
		});
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
			showBookmarkModal = true;
			(document.getElementById('bookmarkModal') as HTMLDialogElement)?.showModal();
			index = e.detail.index
		}
	}

	async function saveBookmark(e: any){

		bookmarks.push({
			index: e.detail.index,
			name: e.detail.name
		})
		bookmarks = bookmarks

		await updateDb();
		(document.getElementById('bookmarkModal') as HTMLDialogElement)?.close();
		showBookmarkModal = false
	}

	function closeBookmarkModal(){
		(document.getElementById('bookmarkModal') as HTMLDialogElement)?.close();
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

	function getImagesCost(results: any, model: string){
		const images = getTotalImageCost(results, model);
		let total = 0;

		total += images["s_count"] * 0.016;
		total += images["m_count"] * 0.018;
		total += images["l_count"] * 0.02;

		total += images["dall_e_3_standard_square"] * 0.04;
		total += images["dall_e_3_hd_square"] * 0.08;

		total += images["dall_e_3_standard_landscape"] * 0.08;
		total += images["dall_e_3_hd_landscape"] * 0.12;

		total += images["dall_e_3_standard_portrait"] * 0.08;
		total += images["dall_e_3_hd_portrait"] * 0.12;

		return total;
	}

	const onChangeModel = (e: any) => {
		model = e.target.value

		if(model == "dall-e-2"){
			size = "256x256"
		}
		
		if(model == "dall-e-3"){
			size = "1024x1024"
		}

		return;
	}

</script>
<div class="flex flex-col w-full px-4 pb-4 items-center gap-4 grow max-h-full relative h-[0px]">
	<div class="navbar bg-base-200 shadow-lg rounded-md gap-4"> 
            
		
		<div class="form-control grow shadow-inner">
			<div class="join w-full">
			  <input 
				type="text" 
				placeholder="Unnamed thread" 
				class="input w-full text-base-content join-item"
				bind:value={threadname}
				/>
			  <button class="btn btn-secondary" on:click={async ()=>{
				await updateDb()
			  }}>
			  <div class="w-5 join-item">
				<MdSave />
			</div>	
			  </button>
			</div>
		</div>
		
		
		<div class="btn btn-accent break-keep swap-off">
				
			${getImagesCost(results, model).toFixed(4)}
		</div>
		{#if bookmarks.length > 0}
		<div class="dropdown dropdown-bottom dropdown-end z-[1]">
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
			
			{#if threadID == ""}
			<div class="p-4 flex gap-4">
				
				<select bind:value={model} class="select shrink" on:change={onChangeModel}>
					<option selected value={'dall-e-2'}>Dall-E 2</option>
					<option value={'dall-e-3'}>Dall-E 3</option>
				</select>
			</div>
			{/if}
			{#each results as message, index}
				<ImageMessage 
				type={message.role} 
				message={message.data} 
				user= {auth.currentUser}
				index = {index}
				bookmarked = {bookmarks.find((item) => item.index == index) ? true : false}
				expiry = {message.created}
				size = {message.size}
				on:bookmark={updateBookmark}
				on:revisePrompt={(message) => {
					prompt = message.detail.prompt
				}}
				/>
			{/each}

			{#if loading}
				<div class="p-4 flex gap-4">
					<progress class="progress progress-primary w-full"></progress>
				</div>
			{/if}
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
			<input type="number" min="1" disabled={model == 'dall-e-3'} max={
				model == 'dall-e-2' ? '10' : '1'
			} placeholder="Number of images" bind:value={n} class="input input-bordered input-primary w-full max-w-xs" />
		</div>
		<div class="form-control w-full max-w-xs">
			<label class="label">
			  <span class="label-text">Image Size</span>
			</label>
			<select class="select select-bordered select-primary" bind:value={size}>
				{#if model == "dall-e-2"}
					<option value="256x256">256x256</option>
					<option value="512x512">512x512</option>
					<option value="1024x1024">1024x1024</option>
				{:else}
					<option value="1024x1024">1024x1024</option>
					<option value="1792x1024">1792x1024</option>
					<option value="1024x1792">1024x1792</option>
				{/if}
			</select>
		</div>
		<div class="form-control w-full max-w-xs">
			<label class="label">
			  <span class="label-text">Quality</span>
			</label>
			<select class="select select-bordered select-primary" bind:value={quality}>
				<option value="standard">Standard</option>
				<option value="hd">HD</option>
			</select>
		</div>
	</div>
	<form
		class="flex w-full items-stretch rounded-md gap-4 bg-base-300 p-4"
		on:submit|preventDefault={() => handleSubmit()}
	>
		<textarea class="textarea textarea-xs text-sm max-h-48 w-full text-base-content" on:keypress={handleInput} bind:value={prompt} />
		{#if loading}
			<button type="submit" class="btn btn-primary btn-square loading" disabled>
			</button>
		{:else if prompt == ""}
			<button type="submit" class="btn btn-primary" disabled>Send</button>
		{:else}
			<button type="submit" class="btn btn-primary">Send</button>
		{/if}
	</form>
	<dialog class="modal modal-bottom sm:modal-middle" id='bookmarkModal'>
			
		<BookmarkModal showModal={showBookmarkModal} index={index} on:saveBookmark={saveBookmark} on:closeModal={closeBookmarkModal}/>

	</dialog>
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