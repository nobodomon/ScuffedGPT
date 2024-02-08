<script lang="ts">
	import ChatMessage from '$lib/components/ChatMessage.svelte'
	import BookmarkModal from '$lib/components/BookmarkModal.svelte'
	import MdBookmark from 'svelte-icons/md/MdBookmark.svelte'
	import MdSave from 'svelte-icons/md/MdSave.svelte'
	import MdInfo from 'svelte-icons/md/MdInfo.svelte'
	import MdAdd from 'svelte-icons/md/MdAdd.svelte'
	import MdDelete from 'svelte-icons/md/MdDelete.svelte'
	import MdPictureAsPdf from 'svelte-icons/md/MdPictureAsPdf.svelte'
	import type {ChatMessageWrapper} from '$lib/ChatMessageWrapper'

    import { getFirestore, addDoc, setDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'

    import {threadsCollection} from "../../firebase"

	import {createEventDispatcher} from 'svelte';
	import { getTokens, getTotalTokens } from '$lib/tokenizer'
	import { updateTokenUsed } from '$lib/token'
	import TextRecognition from './TextRecognition.svelte'

	import {useChat} from 'ai/svelte'
	import { deleteObject, getStorage, ref } from 'firebase/storage'
	import CryptoJS from 'crypto-js'

    export let threadID = ""
	let threadname = ""
	let chatMessages: ChatMessageWrapper[] = []
	let bookmarks: any[] = []
	let users: any[] = []
	let errors: any[] = []
	let locked: boolean = false

	let loading: boolean = false
	let inProgress: boolean = false

	let fetching: boolean = false

	let model: string = 'gpt-3.5-turbo-0125'
	let systemMessage: string = ''
	let chatQuery: string = ''

	let showTextRecognition: boolean = false
	let showBookmarkModal: boolean = false
	let answer: string = ''
    let firestore = getFirestore()
    let auth = getAuth()
	let scrollToDiv: HTMLDivElement

	let encrytedMessages: string = ""

	let imageList: any[] = []

	let imageReferences: any[] = []

	$: imageReferences = imageReferences

	let image: File | undefined = undefined;
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

	export function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}
	
	const {input,handleSubmit, isLoading, messages, append} = useChat({
		api: '/api/chat',
		onResponse: async (response) => {
			//answer = lastmessage.content
			$input = ""
			console.log($messages);
			scrollToBottom();
		},
		onFinish: async () => {
			const lastmessage = $messages[$messages.length - 1];
			const messageBeforeLast = $messages[$messages.length - 2];
			
			chatMessages = [...chatMessages, { role: 'assistant',name:'ScuffedGPT', content: lastmessage.content, id: threadID, profilePic: auth.currentUser!!.photoURL ?? undefined }]
			const ansToken = await getTokens(lastmessage.content)
			const promptToken = await getTokens(messageBeforeLast.content)
			console.log(ansToken);
			console.log(promptToken);
			answer = ''
			imageReferences = []
			await updateDb();
			await updateTokenUsed({
				prompt: promptToken,
				answer: ansToken,
			},model, imageReferences);
			scrollToBottom()
		},
		onError: (err) => {
			handleError(err)
		},
		initialMessages: chatMessages.slice(-9),
		body:{
			model: model,
			systemMessage: systemMessage,
			imageReferences: imageReferences
		},
		sendExtraMessageFields: true
	})


	const dispatch = createEventDispatcher();

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

		console.log(imageList);
		const key = users.toString().split(',').sort().join(',');
        if(threadID != ""){
            await setDoc(doc(firestore, "Threads", threadID), {
                name: threadname,
                messages: locked ? encrypt(chatMessages, key) : chatMessages,
				model: model,
                users: users,
				bookmarks: bookmarks,
				createdOn: serverTimestamp(),
				updatedOn: serverTimestamp(),
				systemMessage: systemMessage,
				imageList: imageList,
				locked: locked
            },{merge: true})
        }else{
            await addDoc(threadsCollection, {
                name: threadname,
                messages: locked ? encrypt(chatMessages, key) : chatMessages,
				model: model,
                users: users,
				bookmarks: bookmarks,
				updatedOn: serverTimestamp(),
				systemMessage: systemMessage,
				imageList: imageList,
				locked: locked
            }).then((docRef) => {
                threadID = docRef.id

				dispatch("adddoc", {
					threadID: threadID,
				});
            })
        }
    }

	
	async function lockThread(){
		
		const key = users.toString().split(',').sort().join(',');
		locked = true;
		
		//encrypt the chatMessages

		//console.log(encrypt(chatMessages, key));

		await updateDb();


		hideLockConfirmation();
	}

	async function unlockThread(){
		locked = false;
		const key = users.toString().split(',').sort().join(',');
		chatMessages = await decrypt(encrytedMessages, users.toString().split(',').sort().join(','));
		await updateDb();
		hideLockConfirmation();
	}


	function encrypt(messages: any, key:string){
		//encrypt the messages
		var cipher = CryptoJS.AES.encrypt(JSON.stringify(messages), key).toString();
		return cipher;
	}

	function decrypt(messages: any, key:string){
		//decrypt the messages
		var bytes  = CryptoJS.AES.decrypt(messages, key);
		var originalText = bytes.toString(CryptoJS.enc.Utf8);
		console.log(originalText);
		return JSON.parse(originalText);
	}


	export async function getThread(threadId: string){
		fetching = true;
		onSnapshot(doc(firestore, "Threads", threadId), (doc:any) => {
			
			if(doc.data()!!.locked){
				if(doc.data()!!.users.indexOf(auth.currentUser!!.uid) == -1){
					chatMessages = [];
				}else{
					console.log("Thread is locked");
					const key = doc.data()!!.users.toString().split(',').sort().join(',');
					chatMessages = decrypt(doc.data()!!.messages, key);
					encrytedMessages = doc.data()!!.messages;
				}
			}else{
				chatMessages = doc.data()!!.messages;
			}



			threadname = doc.data()!!.name;
			model = doc.data()!!.model;
			users = typeof doc.data()!!.users == 'string' ? [doc.data()!!.users] : doc.data()!!.users;
			bookmarks = doc.data()!!.bookmarks ? doc.data()!!.bookmarks.sort((a:any,b: any)=> a.index > b.index) : [];
			systemMessage = doc.data()!!.systemMessage ? doc.data()!!.systemMessage : "";
			imageList = doc.data()!!.imageList ? doc.data()!!.imageList : [];
			fetching = false;
			locked = doc.data()!!.locked ?? false;

			scrollToBottom()
		});
	}

	function detectImg(e: ClipboardEvent){
		let newImage: File | undefined = undefined;
		if (e.clipboardData) {
			let showDialog = false;
			const {items} = e.clipboardData;
			if (items) {
				let file: File | null = null;
				for (let i = 0; i < 1; i++) {
					console.log(items)
					if(items[i].type.indexOf('image') !== -1) {
						// Image is pasted, handle it here
						file = items[i].getAsFile();
						newImage = file!!;
						showDialog = true;

						continue;
					}

					if(items[i].type == 'application/pdf'){
						file = items[i].getAsFile();
						// await read(file).then((reader) => {
						// 	console.log(reader.result);
						// 	showDialog = true;
						// })
						newImage = file!!;
						showDialog = true;

						continue;
					}
				}
			}else { // If items array does not exist, check for files array
				const files = e.clipboardData.files;
				if (files.length > 0) {
					let file: File | null = null;
					// Files are pasted, check if an image is present and handle it accordingly
					for(let i = 0; i < 1; i++){
						if(files[i].type.indexOf('image') !== -1){

							newImage = file!!;
							showDialog = true;

							continue;
						}

						if(files[i].type == 'application/pdf'){
							newImage = file!!;
							showDialog = true;
						
							continue;
						}
					}
				}
			}

			if(showDialog){
				console.log(image);
				showTextRecognition = true;
				image = newImage;
				(document.getElementById("textRecognitionModal") as HTMLDialogElement).showModal();
			}
		}
	}


	function closeModal(){
		image = undefined;
		(document.getElementById("textRecognitionModal") as HTMLDialogElement).close();
	}

	async function appendUrl(e:any){
		imageList.push({
			url: e.detail.fileURL,
			type: e.detail.fileType,
			name: e.detail.originalFileName,
			newName: e.detail.newFileName
		});
		image = undefined;

		await updateDb();
	}

	function addFileReference(file: any){
		let newReference = structuredClone(imageReferences);

		if(newReference.find((reference)=>{return reference.url == file.url}) == undefined){
			newReference.push(file)
		}else{
			newReference = newReference.filter((item)=>{return item.url != file.url})
		}

		imageReferences = newReference;

		console.log(imageReferences);
	}

	async function deleteFileReference(file: any){
		imageList = imageList.filter((item)=>{return item.url != file.url})
		imageReferences = imageReferences.filter((item)=>{return item.url != file.url})
		
		await updateDb();
		const storage = getStorage();
		const fileRef = ref(getStorage(), 'threadImages/' + `${file.newName}`);
		
		deleteObject(fileRef).then(() => {
			console.log('File deleted successfully');
		}).catch((error) => {
			console.error('Error removing file: ', error);
		});
	}


	function removeReference(index: number){
		let newReference = structuredClone(imageReferences);

		newReference.splice(index, 1);

		imageReferences = newReference;
	}

	function appendPrompt(e: any){
		$input += e.detail.text

	}

	async function handleInput(e: any){
		if(e.key == "Enter" && !e.shiftKey && !$isLoading){
			e.preventDefault();
			await handleSubmitWrapper(e);
		}

		$input = e.target.value;
	}

	const handleSubmitWrapper = async (e: any) => {

		let prompt = $input;

		if(model == "gpt-4-vision-preview"){

			let payload = chatMessages.slice(-9);

			$messages = payload;


			chatMessages = [...chatMessages, { 
				role: 'user',name:auth.currentUser!!.displayName ?? undefined, 
				content: prompt, 
				id: threadID, 
				imageReference: imageReferences, 
				profilePic: auth.currentUser!!.photoURL ?? undefined
			}]
			scrollToBottom();
			await append({ role: 'user',name:auth.currentUser!!.displayName ?? undefined, content: prompt, id: threadID },{
				options:{
					body:{
						imageReferences: imageReferences,
						model: model,
						systemMessage: systemMessage
					}
				}
			
			})
			

			// await handleSubmit(e, {
			// 	data: {
			// 		imageReferences: JSON.stringify(imageReferences),
			// 		model: model,
			// 		systemMessage: systemMessage
			// 	}
			// })

			$input = ""

		}else{

			let payload = chatMessages.slice(-9);

			$messages = payload;

			chatMessages = [...chatMessages, { role: 'user',name:auth.currentUser!!.displayName ?? undefined, content: prompt, id: threadID }]
			scrollToBottom();
			await append({ role: 'user',name:auth.currentUser!!.displayName ?? undefined, content: prompt, id: threadID },{
				options:{
					body:{
						imageReferences: imageReferences,
						model: model,
						systemMessage: systemMessage
					}
				}
			})


			// await handleSubmit(e, {
			// 	data: {
			// 		imageReferences: JSON.stringify(imageReferences),
			// 		model: model,
			// 		systemMessage: systemMessage
			// 	}
			// })

			$input = ""
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
		bookmarks = bookmarks;

		await updateDb();
		(document.getElementById('bookmarkModal') as HTMLDialogElement)?.close();
		showBookmarkModal = false;
	}

	function closeBookmarkModal(){
		(document.getElementById('bookmarkModal') as HTMLDialogElement)?.close();
		showBookmarkModal = false;
		index = -1;
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

	const showLockThreadConfirmation = () => {
		(document.getElementById('lockThreadConfirmation') as HTMLDialogElement).showModal()
	}

	const hideLockConfirmation = () => {
		(document.getElementById('lockThreadConfirmation') as HTMLDialogElement).close()
	}

	const checkAccess = () => {
		if(locked && users.indexOf(auth.currentUser!!.uid) == -1){
			return false
		}else{
			return true
		}
	}

</script>
{#if checkAccess()}
<div class="flex flex-col w-full px-4 pb-4 items-stretch gap-4 grow max-h-full relative h-[0px]">
	<div class="navbar bg-base-200 shadow-lg rounded-md gap-4"> 
		<div class="form-control grow shadow-inner">
			<div class="join w-full">
			  <input 
				type="text" 
				placeholder="Unnamed thread" 
				class="input w-full text-base-content join-item"
				bind:value={threadname}
				/>
			  <button class={`btn btn-secondary ${checkAccess() ? "" : "disabled"}`} on:click={async ()=>{
				if(checkAccess()){
					await updateDb();
				}else{
					handleError("You do not have access to this thread")
				}
			  }}>
			  	<div class="w-5 join-item">
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
		<button class={`btn btn-square ${locked ? "btn-error": 'btn-primary'}`} on:click={showLockThreadConfirmation}>
			{#if locked } 
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
				</svg>

			{:else}

				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
				</svg>
			{/if}
		</button>
	</div>
	<div class={" bg-base-300 rounded-md overflow-y-auto flex flex-col grow " + (answer != "" || $isLoading ? "animate-pulse" : "")}>
		<div class="flex flex-col relative">
		
		{#if fetching}
			<div class="p-4 flex flex-col items-center justify-center">
				
				<span class="loading loading-spinner loading-lg"></span>
			</div>
		{:else}
			{#if threadID == ""}
			<div class="p-4 flex gap-4">
				<div class="form-control grow">
					<div class="join">
						<input type="text" bind:value={systemMessage} class="input w-full join-item" placeholder="Provide a system message... (optional)"/>
						<div class="tooltip tooltip-bottom before:-left-[235%]" data-tip="Provide a system message to get more related results. E.g. You are a software requirements engineer, always prompt me for missing information and when asked for diagrams output it in plantuml">
							<button class="btn btn-square rounded-l-none join-item">
								<div class="w-5">
									<MdInfo />
								</div>
							</button>
						</div>
					</div>
				  </div>
				  
				  <select bind:value={model} class="select shrink">
					<option selected value={'gpt-3.5-turbo-0125'}>GPT 3.5 Turbo</option>
					<option value={'gpt-4-turbo-preview'}>GPT 4 Turbo</option>
					<option value={'gpt-4-vision-preview'}>GPT 4 Vision</option>
				  </select>
			</div>
			{/if}
			{#each chatMessages as message, index}
				<ChatMessage 
				type={message.role} 
				message={message.content} 
				profilePic={message?.profilePic}
				imageReference={message?.imageReference}
				name= {message.name}
				user= {auth.currentUser}
				index = {index}
				bookmarked = {bookmarks.find((item) => item.index == index) ? true : false}
				on:bookmark={updateBookmark}
				/>
			{/each}
			{#if $isLoading}
				<ChatMessage 
					type="assistant" 
					message={$messages[$messages.length - 1]?.content == $input ? "Loading..." : $messages[$messages.length - 1]?.content ?? ""} 
					name={'ScuffedGPT'}
					profilePic={undefined}
					imageReference={undefined}
					loading={$isLoading} 
					user= {auth.currentUser}
					index = {-1}
					bookmarked = {false}
					/>
			{/if}
		{/if}
		</div>
		<div class="" bind:this={scrollToDiv} />

	</div>
	{#if imageReferences.length > 0}
	<div class="flex items-stretch rounded-md gap-4 bg-base-300 p-4">
		{#key imageReferences}
			{#each imageReferences as reference, index}
				<div class="relative">
					{#if reference.type != 'pdf'}
						<img src={reference.url} alt={reference.name} class="rounded-lg w-24 h-24 object-contain"/>
					{:else}
						<div class="rounded-lg w-24 h-24 object-cover flex-col flex items-center justify-center">
							<div class="w-10">
								<MdPictureAsPdf />
							</div>
							<marquee>{reference.name}</marquee>
						</div>
					{/if}
					<div on:click={(e)=>{removeReference(index)}} class="absolute w-full backdrop-blur h-full flex items-center justify-center top-[0] left-[0] opacity-[0] transition-all hover:opacity-[100]">
						<div class="w-10">
							<MdDelete/>
						</div>
					</div>
				</div>
			{/each}
		{/key}
	</div>
	{/if}
	<form
		class="flex items-stretch rounded-md gap-4 bg-base-300 p-4"
		on:submit={$isLoading ? null : handleSubmitWrapper}
	>	
		{#if imageList.length > 0}
		<div class="dropdown dropdown-top">
			<div tabindex="0" role="button" class="btn btn-square">
				<div class="w-5">	
					<MdAdd />
				</div>
			</div>
				<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
				<ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box">
				{#each imageList as image, index}
					<li class="flex items-stretch gap-2">
						<div class="w-full flex">
							<button on:click={
								(e)=>{
									addFileReference(image)
								}
							} class="flex-grow text-left" type="button">{image.name}</button>
							<button on:click={
								(e)=>{
									deleteFileReference(image)
								}
							} class="btn btn-square">
								<div class="w-5">
									<MdDelete/>
								</div>
							</button>
						</div>
					</li>
					
				{/each}
			</ul>
	  	</div>
		{/if}
		<textarea class="textarea textarea-xs text-sm max-h-48 w-full text-base-content" on:keypress={handleInput} on:paste={detectImg} bind:value={$input}
			disabled = {
				locked? !checkAccess() : false
			}
		/>
		{#if $isLoading}
			<button type="submit" class={`btn btn-primary btn-square loading ${$isLoading ? "disabled" : ""}`}>
			</button>
		{:else if $input == ""}
			<button type="submit" class="btn btn-primary" disabled>Send</button>
		{:else}
			<button type="submit" class="btn btn-primary" disabled = {
				locked? !checkAccess() : false
			}>Send</button>
		{/if}
	</form>
	
	
	<TextRecognition bind:image={image} on:closeModal={closeModal} on:useAsPrompt={appendPrompt} on:useAsImage={appendUrl} allowImageInput={model == "gpt-4-vision-preview"}/>
	
	<BookmarkModal showModal={showBookmarkModal} index={index} on:saveBookmark={saveBookmark} on:closeModal={closeBookmarkModal}/>

	<dialog id="lockThreadConfirmation" class="modal">
		<div class="modal-box">
			<div class="flex flex-col items-start gap-4">
				{#if locked}
					<h3 class="font-bold text-lg">Are you sure you want to unlock this thread?</h3>
					<p class="text-base-content">Once unlocked, you can share this thread with anyone again.</p>
				{:else}
				
					<h3 class="font-bold text-lg">Are you sure you want to lock this thread?</h3>
					<p class="text-base-content">Once locked, you will not be able to share this thread unless you unlock it again.</p>
					<p class="text-base-content">Anyone that you shared this thread with will still be able to access this thread.</p>
				{/if}
				<div class="flex gap-4 justify-end w-full">
					{#if locked}
						<button class="btn btn-error" on:click={unlockThread}>Unlock</button>
					{:else}
						<button class="btn btn-primary" on:click={lockThread}>Lock</button>
					{/if}
					<button class="btn btn-primary" on:click={hideLockConfirmation}>Cancel</button>
				</div>
			</div>
		</div>
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
{:else}
	<div class="rounded-box bg-base-200 border border-error p-4 flex items-center gap-4">
		<p class="text-base-content">You do not have access to this thread.</p>
		<a href="/" class="btn btn-ghost">Go back</a>
	</div>
{/if}