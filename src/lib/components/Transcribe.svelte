<script lang="ts">
	import { SSE } from 'sse.js'
    import Dropzone from 'svelte-file-dropzone';
    import {languages,languagesArray,languagesCodeArray} from"../../utils";
    
    import {transcriptionsCollection} from "../../firebase"
	import { getFirestore, addDoc, setDoc, doc, getDoc } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'
	import { createEventDispatcher } from 'svelte'
	import { onMount } from 'svelte'

    import MdContentCopy from 'svelte-icons/md/MdContentCopy.svelte'
	import { text } from 'svelte/internal'
    import moment from 'moment'

    export let transcriptionId = ""

    let loading = false;
    let fetching = false;
    
    const dispatch = createEventDispatcher();

    let firestore = getFirestore()
    let auth = getAuth()

    let files:any = {
        accepted: [],
        rejected: []
    }

    const allowedFormats = [".mp3",".mp4",".mpeg",".mpga",".m4a",".wav",".webm"]
    const allowedFormatsString = allowedFormats.join(", ")
    let language = ''
    let transcriptionName = ''

    let transcriptionModeRaw = true

    let output = ''

    onMount(async () => {
        await getTranscription(transcriptionId)
    })
    
    let segments: any[] = []

    const handleFileUpload = (e: any) => {
        console.log(e)

        const {acceptedFiles, fileRejections} = e.detail;
        files.accepted = [...files.accepted, ...acceptedFiles];
        files.rejected = [...files.rejected, ...fileRejections];
    }

    const handleSubmit = async () => {
        loading= true
        
        const formData = new FormData();

        console.log(files.accepted[0])

        formData.append('file', files.accepted[0])
        formData.append('language', language)

        const eventSource = await fetch('/api/whisper',{
            method: 'POST',
            body: formData
        }).then(res => res.json())

        console.log(eventSource);

        segments = eventSource.segments
        output = eventSource.text

        files.accepted = []
        loading = false
    }

    function handleError<T>(err: T) {
        loading = false
        console.error(err)
    }

    function selectFile(e:any){
        files.accepted = [e.target.files[0]]
    }

    function findLanguageCode(e: any) {
        language = languages[e.target.value as keyof typeof languages]
    }

    function saveTranscription(){
        if(transcriptionId !== ""){
            setDoc(doc(firestore, "Transcriptions", transcriptionId), {
                segments: segments,
                language: language,
                date: new Date(),
                user: auth.currentUser?.uid,
                name: transcriptionName
            }).then(() => {
                console.log("Document successfully written!");
                dispatch("transcriptionUpdate",{
                    id: transcriptionId
                })
            })
        }else{
                
            addDoc(transcriptionsCollection, {
                segments: segments,
                language: language,
                text: output,
                date: new Date(),
                user: auth.currentUser?.uid,
                name: transcriptionName
            }).then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
                transcriptionId = docRef.id
                dispatch("transcriptionNew",{
                    id: docRef.id
                })
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            });
            
        }
    }

    export async function getTranscription(transcriptionId: string){
        fetching = true;
        if(transcriptionId == ""){
            fetching = false;
            output = ""
            segments = []
            language = ""
            transcriptionName = ""
            return;
        }
        getDoc(doc(firestore, "Transcriptions", transcriptionId)).then((doc) => {
            if (doc.exists()) {
                segments = doc.data()!!.segments
                output = doc.data()!!.text
                language = doc.data()!!.language
                transcriptionName = doc.data()!!.name
                fetching = false
            } else {
                // doc.data() will be undefined in this case
                segments = []
                output = ""
                language = ""
                transcriptionName = ""
                fetching = false
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
    }


	function formatText(message: string) {
        let parts: any[] = []; // initialize the parts array
        parts = message.split("\n")

        return parts;
	}

    function clearUploads () {
        files.accepted = []
    }

    const copyToClipboard = (text: string) =>{
        navigator.clipboard.writeText(text)
    }   

    function toSeconds(time: number){
        return moment(time,"s.S").format('mm:ss:SS')
    }

</script>


<div class="h-[0px] max-h-full relative grow w-full flex flex-col gap-4 md:flex-row pb-4">
    {#if loading}
    <progress class="progress w-full"></progress>
    {:else if output == ""}
    <div class="flex flex-col gap-4 md:pl-4 md:pr-0 px-4">
        <Dropzone
        containerClasses="card md:w-96 h-full border-primary border bg-base-900 shadow-xl p-4"
        disableDefaultStyles={true}
        multiple={false}
        on:drop={handleFileUpload}
        accept = {allowedFormats}
        >   
            <div class="flex flex-col items-stretch justify-between w-full h-full gap-4 prose">
                <h1 class="
                    w-full 
                    grow
                    h-48
                    flex
                    text-lg 
                    items-center 
                    justify-center
                    border-dashed border-2 rounded-lg
                    text-base-content
                ">Drag and drop your file here</h1>
                <h1 class="text-md text-base-content">
                    <span class="font-bold">Supported formats:</span> {allowedFormatsString}
                </h1>
                <input type="file" disabled={files.accepted.length > 0} accept={allowedFormatsString} on:change={selectFile} on:click|preventDefault={()=>{}} class="file-input file-input-bordered file-input-primary w-full" />
            </div>
        </Dropzone>
        {#if files.accepted.length > 0}
        <div class="card w-full bg-base-300 shadow-xl">
            <div class="card-body  text-base-content">
                
                <div class="card-actions justify-end">
                    <button class="btn btn-square btn-sm" on:click={clearUploads}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <h2 class="card-title">File Name</h2>
                <p>{files.accepted[0].name}</p>
            </div>
          </div>
        <select class="select select-primary w-full text-base-content" on:change={(e)=>{findLanguageCode(e)}}>
            <option disabled selected>What language is this in?</option>
            {#each languagesArray as lang}
                <option value={lang}>{lang}</option>
            {/each}
          </select>
        <input type="text" bind:value={language} placeholder="Language" disabled class="input input-bordered text-base-content input-primary w-full" />
        <button class="btn btn-primary" on:click={handleSubmit}>Upload</button>
        {/if}
    </div>
    {:else}
    <div class="flex flex-col max-w-full grow md:w-[0px] h-full max-h-full relative px-4 gap-4">
        <div class="navbar bg-primary shadow-lg shadow-lg rounded-md gap-4"> 
            
            <input type="text" placeholder="Transcription name" class="grow input input-bordered text-base-content input-primary w-full" bind:value={transcriptionName}/>
            <label class="swap btn btn-ghost text-base-content">
                <input type="checkbox" on:change={()=>{transcriptionModeRaw = !transcriptionModeRaw}}/>
                <div class="swap-on">RAW</div>
                <div class="swap-off">CHAT</div>
            </label>
            <button class="btn btn-ghost text-base-content" on:click={saveTranscription}>Save</button>
            
        </div>
        <div class="max-w-full grow p-4 gap-4 flex flex-col relative h-full bg-base-300 rounded-md overflow-y-auto">
            {#if transcriptionModeRaw}
                <div class="flex items-center">
                    <div class="flex grow flex-col">
                        <span class=" text-base-content font-bold">Transcription Result</span>
                        <div class="flex flex-col gap-4 text-base-content">
                            {output}
                        </div>
                        
                    </div>

                    <button class="btn btn-ghost text-sm text-base-content" on:click={()=>{copyToClipboard(output)}}>
                        <div class="w-10 p-2">
                            <MdContentCopy />
                        </div>
                        Copy All
                    </button>
                </div>

                {#each segments as segment}
                    <div class="flex items-center">
                        <div class="flex grow flex-col text-base-content">
                            <span class="font-bold text-base-content">[{toSeconds(segment.start)} - {toSeconds(segment.end)}]</span>
                            {segment.text}
                        </div>
                        <button class="btn btn-ghost text-sm text-base-content" on:click={()=>{copyToClipboard(segment.text)}}>
                            <div class="w-10 p-2  text-base-content">
                                <MdContentCopy />
                            </div>
                            Copy Text
                        </button>
                    </div>
                {/each}
            {:else}
                <div class="chat chat-start">
                    <div class="chat-image avatar">
                    <div class="w-10 rounded-full">
                        <img src="https://ui-avatars.com/api/?name=S" alt="user avatar" /></div>
                    </div>
                    <div class="chat-bubble chat-bubble-primary">Transcription Results</div>
                </div>
                <div class="chat chat-start">
                    <div class="chat-image avatar">
                    <div class="w-10 rounded-full">
                        <img src="https://ui-avatars.com/api/?name=S" alt="user avatar" /></div>
                    </div>
                    <div class="chat-bubble chat-bubble-primary">
                        <div class="flex items-center flex-col gap-4">
                            <div class="flex grow flex-col">
                                {output}
                            </div>
                            <button class="btn btn-ghost text-sm self-end" on:click={()=>{copyToClipboard(output)}}>
                                <div class="w-10 p-2">
                                    <MdContentCopy />
                                </div>
                                Copy Text
                            </button>
                        </div>
                    </div>
                </div>
                {#each segments as segment}
                <div class="chat chat-start">
                    <div class="chat-image avatar">
                    <div class="w-10 rounded-full">
                        <img src="https://ui-avatars.com/api/?name=S" alt="user avatar" /></div>
                    </div>
                    <div class="chat-bubble">
                        <div class="flex items-center flex-col gap-4">
                            <div class="flex grow flex-col">
                                <span class="font-bold">[{toSeconds(segment.start)} - {toSeconds(segment.end)}]</span>
                                {segment.text}
                            </div>
                            <button class="btn btn-ghost text-sm self-end" on:click={()=>{copyToClipboard(segment.text)}}>
                                <div class="w-10 p-2">
                                    <MdContentCopy />
                                </div>
                                Copy Text
                            </button>
                        </div>
                    </div>
                </div>
                {/each}
                
            {/if}
        </div>
    </div>
    
    {/if}
</div>