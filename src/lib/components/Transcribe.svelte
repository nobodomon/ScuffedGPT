<script lang="ts">
	import { SSE } from 'sse.js'
    import Dropzone from 'svelte-file-dropzone';
    import {languages,languagesArray,languagesCodeArray} from"../../utils";
    
    import {transcriptionsCollection} from "../../firebase"
	import { getFirestore, addDoc, setDoc, doc, getDoc } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'
	import { createEventDispatcher } from 'svelte'
	import { onMount } from 'svelte'
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

    let language = ''
    let transcriptionName = ''

    let transcriptionModeRaw = true

    export let output = ''

    onMount(async () => {
        await getTranscription(transcriptionId)
    })

    const handleFileUpload = (e: any) => {
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

        output = eventSource.text
        files.accepted = []
        loading = false
    }

    function handleError<T>(err: T) {
        loading = false
        console.error(err)
    }

    function findLanguageCode(e: any) {
        language = languages[e.target.value as keyof typeof languages]
    }

    function saveTranscription(){
        if(transcriptionId !== ""){
            setDoc(doc(firestore, "Transcriptions", transcriptionId), {
                text: output,
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
                text: output,
                language: language,
                date: new Date(),
                user: auth.currentUser?.uid,
                name: transcriptionName
            }).then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
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
            language = ""
            transcriptionName = ""
            return;
        }
        getDoc(doc(firestore, "Transcriptions", transcriptionId)).then((doc) => {
            if (doc.exists()) {
                output = doc.data()!!.text
                language = doc.data()!!.language
                transcriptionName = doc.data()!!.name
                fetching = false
            } else {
                // doc.data() will be undefined in this case
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
        parts = output.split("\n")

        return parts;
	}

</script>


<div class="h-[100svh] w-full flex flex-col gap-4 md:flex-row">
    {#if transcriptionId == ""}
    <div class="flex flex-col gap-4 px-4">
        <Dropzone
        containerClasses="card md:w-96 md:h-96 bg-gray-900 shadow-xl p-4"
        disableDefaultStyles={true}
        multiple={false}
        on:drop={handleFileUpload}
        >   
            <div class="flex flex-col items-stretch justify-between w-full h-full gap-4 prose">
                <h1 class="
                w-full 
                grow
                flex 
                items-center 
                justify-center
                border-dashed border-2 rounded-lg
                ">Drag and drop a .mp3 file</h1>
                <input type="file" class="file-input file-input-bordered file-input-primary w-full" />
            </div>
        </Dropzone>
        {#if files.accepted.length > 0}
        <select class="select select-primary w-full" on:change={(e)=>{findLanguageCode(e)}}>
            <option disabled selected>What language is this in?</option>
            {#each languagesArray as lang}
                <option value={lang}>{lang}</option>
            {/each}
          </select>
        <input type="text" bind:value={language} placeholder="Language" disabled class="input input-bordered input-primary w-full" />
        <button class="btn btn-primary" on:click={handleSubmit}>Upload</button>
        {/if}
    </div>
    {/if}
    <div class="flex flex-col max-w-full grow md:w-[0px] h-full max-h-full md:pr-4 pb-4 px-4 gap-4">
        <div class="navbar bg-gray-900 rounded-md gap-4"> 
            
            <input type="text" placeholder="Transcription name" class="grow input input-bordered input-primary w-full" bind:value={transcriptionName}/>
            <label class="swap btn btn-ghost">
                <input type="checkbox" on:change={()=>{transcriptionModeRaw = !transcriptionModeRaw}}/>
                <div class="swap-on">RAW</div>
                <div class="swap-off">CHAT</div>
            </label>
            <button class="btn btn-ghost" on:click={saveTranscription}>Save</button>
            
        </div>
        <div class="max-w-full grow p-4 gap-4 flex flex-col relative h-full bg-gray-900 rounded-md overflow-y-auto">
            
            {#if loading}
            <progress class="progress progress-primary w-56 place-items-center"></progress>
            {:else}
                {#if transcriptionModeRaw}
                <p>{output}</p>
                {:else}
                    <div class="chat chat-start">
                        <div class="chat-image avatar">
                        <div class="w-10 rounded-full">
                            <img src="https://ui-avatars.com/api/?name=S" alt="user avatar" /></div>
                        </div>
                        <div class="chat-bubble chat-bubble-primary">Transcription Results</div>
                    </div>

                    {#if formatText(output).length > 0}
                        {#each formatText(output) as part}
                        <div class="chat chat-start">
                            <div class="chat-image avatar">
                            <div class="w-10 rounded-full">
                                <img src="https://ui-avatars.com/api/?name=S" alt="user avatar" /></div>
                            </div>
                            <div class="chat-bubble chat-bubble-primary">{part}</div>
                        </div>
                        {/each}
                    {/if}
                {/if}
            {/if}
        </div>
    </div>
</div>