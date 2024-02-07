<script lang="ts">
    import Dropzone from 'svelte-file-dropzone';
    import {formatBytes, getBytesFromUnit, languages,languagesArray, toSeconds} from"../../utils";
    
    import {transcriptionsCollection} from "../../firebase"
	import { getFirestore, addDoc, setDoc, doc, getDoc } from 'firebase/firestore'
    import { getAuth } from 'firebase/auth'
	import { createEventDispatcher } from 'svelte'

    import MdContentCopy from 'svelte-icons/md/MdContentCopy.svelte'
    import MdRemoveCircleOutline from 'svelte-icons/md/MdRemoveCircleOutline.svelte'
    import MdAccessTime from 'svelte-icons/md/MdAccessTime.svelte'
    import MdAttachMoney from 'svelte-icons/md/MdAttachMoney.svelte'
	import { updateTokenUsed } from '$lib/token'
	import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage'
	import { ulid } from 'ulidx'

    export let transcriptionId = ""

	let scrollToDiv: HTMLDivElement
    
    $: if(transcriptionId == "temp"){
    } else if(transcriptionId !== ""){
        getTranscription(transcriptionId)
    }else{
        resetVariables()
    }


    $: transcriptionId != "" && transcriptionId != "temp" &&
        getTranscription(transcriptionId).then(() => {
            scrollToBottom()
        })
	
    $: transcriptionId == "" && 
        resetVariables()

    function resetVariables(){
        segments = []
        output = ""
        transcriptionName = ""
        transcriptionModeRaw = true
        language = "en"
        durations = []
    }

    let loading = false;
    let fetching = false;
    
    const dispatch = createEventDispatcher();

    let firestore = getFirestore()
    let auth = getAuth()

    let files:any = {
        accepted: [],
        rejected: []
    }

    let filePreview: any = []

    const allowedFormats = [".mp3",".mp4",".mpeg",".mpga",".m4a",".wav",".webm"]
    const allowedFormatsString = allowedFormats.join(", ")
    let language = 'en'
    let transcriptionName = ''

    let transcriptionModeRaw = true

    let output = ''

    let processing: number = 0

    let durations: any[] = []
    
    let segments: any[] = []

    let uploadProgress = 0
    let uploadStarted = false

    const handleFileUpload = async (e: any) => {
        const {acceptedFiles, fileRejections} = e.detail;
        files.accepted = [...files.accepted, ...acceptedFiles];
        files.rejected = [...files.rejected, ...fileRejections];
    }

    async function read (file: any) {
        return new Promise<any>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const handleSubmit = async () => {
        let processingOutput = ''
        let processingSegment : any[] = []
        let processingDuration : any[] = []
        try{
            loading= true

            

            for await(const file of files.accepted){
                processing = files.accepted.indexOf(file) + 1
                const formData = new FormData();

                await uploadToStorage(file, async (downloadURL: string, originalFileName: string, fileType: string, newFileName: string) => {
                    
                    console.log(downloadURL, originalFileName, fileType, newFileName);

                    try{
                        formData.append('file', downloadURL)
                        formData.append('fileType', fileType)
                        formData.append('originalFileName', originalFileName)
                        formData.append('newFileName', newFileName)
                        formData.append('language', language)
                        


                        const eventSource = await fetch('/api/whisper',{
                        method: 'POST',
                            body: formData
                        }).then(res => res.json())

                        console.log(eventSource);

                        processingSegment = processingSegment.concat(eventSource.segments)
                        processingOutput = processingOutput.concat(eventSource.text, "\n")
                        processingDuration = processingDuration.concat(eventSource.duration)
                    }catch(e){
                        console.log(e)
                    }finally{
                        
                        await deleteFromStorage(newFileName);
                    }
                })
            }

            console.log(processingDuration)

        
        }catch(e){
            console.log(e);
            loading = false; 
            return;
        }finally{
            await updateTokenUsed(processingDuration, 'whisper-1',undefined);
            loading = false
            processing = 0
            output = processingOutput
            segments = processingSegment
            files.accepted = []
            transcriptionId = "temp"
            durations = processingDuration

            await saveTranscription();
            dispatch("newTranscription",{
                duration: durations.reduce((a: any, b: any) => a + b, 0)
            })
        }
    }

    const uploadToStorage = async (file: File, callback: Function) => {
        return new Promise<void>(async (resolve, reject)=>{
            const storage = getStorage();
            const randomFileID = ulid();
            console.log(file.name);
            const extension = file.name.split('.').pop();
            //const fileNameNoExt = file.name.split('.').slice(0, -1).join('.');
            const newFileName = `${randomFileID}-${file.name}`;
            const fileRef = ref(storage,'transcriptionTempStore/' + `${newFileName}`);

            const uploadTask = uploadBytesResumable(fileRef, file);

            return uploadTask.on('state_changed', (snapshot: { bytesTransferred: number; totalBytes: number; state: any }) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress = progress;
                uploadStarted = true;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            }, (error: any) => {
                console.log(error);
                reject();
            },() => {
                // Handle successful uploads on complete
                uploadStarted = false;
                uploadProgress = 0;
                getDownloadURL(uploadTask.snapshot.ref).then( async  (downloadURL: any) => {
                    console.log('File available at', downloadURL);
                    
                    await callback(downloadURL, file.name, extension, newFileName);
                    resolve();
                });
            });
        })
    }

    const deleteFromStorage = async (newFileName: string) => {
        return new Promise<void>(async (resolve, reject)=>{
            const storage = getStorage();
            const fileRef = ref(getStorage(), 'transcriptionTempStore/' + `${newFileName}`);
            
            deleteObject(fileRef).then(() => {
                console.log('File deleted successfully');
                resolve();
            }).catch((error:any) => {
                console.error('Error removing file: ', error);
                reject();
            });
        })
    }

    function findLanguageCode(e: any) {
        language = languages[e.target.value as keyof typeof languages]
    }

    function saveTranscription(){
        if(transcriptionId !== "temp"){
            setDoc(doc(firestore, "Transcriptions", transcriptionId), {
                segments: segments,
                language: language,
                date: new Date(),
                user: auth.currentUser?.uid,
                name: transcriptionName
            }).then(() => {
                //console.log("Document successfully written!");
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
                name: transcriptionName,
                durations: durations
            }).then((docRef: { id: string }) => {
                //console.log("Document written with ID: ", docRef.id);
                transcriptionId = docRef.id
                dispatch("transcriptionNew",{
                    id: docRef.id
                })
            })
            .catch((error: any) => {
                console.error("Error adding document: ", error);
            });
            
        }
    }

    export async function getTranscription(transcriptionId: string){
        fetching = true;
        if(transcriptionId == ""){
            fetching = false;
            resetVariables()
            return;
        }
        getDoc(doc(firestore, "Transcriptions", transcriptionId)).then((doc: { exists: () => any; data: () => any }) => {
            if (doc.exists()) {
                segments = doc.data()!!.segments
                output = doc.data()!!.text
                language = doc.data()!!.language
                transcriptionName = doc.data()!!.name
                durations = doc.data()!!.durations
                fetching = false
            } else {
                // doc.data() will be undefined in this case
                resetVariables()
                fetching = false
            }
        }).catch((error: any) => {
            //console.log("Error getting document:", error);
        });
    }

    function clearUploads () {
        files.accepted = []
    }

    function clearUpload(index: number){
        files.accepted.splice(index,1)
        filePreview.splice(index,1)
        files = files
    }
    

    const copyToClipboard = (text: string) =>{
        navigator.clipboard.writeText(text)
    }   

    export function scrollToBottom() {
		setTimeout(function () {
			scrollToDiv.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
		}, 100)
	}

</script>


<div class="h-[0px] max-h-full relative grow w-full items-stretch flex justify-center items-center flex-col gap-4 md:flex-row pb-4">
    {#if loading}
    <div class="card w-96">
        <div class="card-body">
            {#if uploadStarted}
                <h2 class="card-title">Uploading...</h2>
                File {processing} of {files.accepted.length}
                <progress class="progress w-full" value={uploadProgress} max="100"></progress>
            {:else}
                <h2 class="card-title">Transcribing...</h2>
                File {processing} of {files.accepted.length}
                <progress class="progress w-full" max={processing / files.accepted.length}></progress>
            {/if}
        </div>
    </div>
    {:else if output == ""}
    <div class="flex flex-col gap-4 md:pl-4 md:pr-0 px-4">
        <Dropzone
        containerClasses="card md:w-96 bg-base-200 shadow-inner p-4 hover:bg-base-300 transition "
        disableDefaultStyles={true}
        maxSize={getBytesFromUnit("MiB",25)}
        on:drop={handleFileUpload}
        accept = {allowedFormats}
        >   
            <div class="flex flex-col items-stretch justify-between w-full h-full gap-4 prose 
                    aspect-square
                    border-dashed border-2 rounded-lg border-primary p-4">
                <h1 class="
                    w-full 
                    grow
                    flex
                    text-lg 
                    items-center 
                    justify-center
                    text-base-content
                    font-bold
                ">Drag and drop your file here</h1>
                <div class="divider text-base-content font-bold ">Supported Formats</div>
                <h1 class="text-md text-base-content flex flex-col">
                    {allowedFormatsString}
                </h1>
            </div>
        </Dropzone>
        
        {#if files.accepted.length > 0}
        <div class="flex flex-col gap-4">
            <select class="select select-primary w-full text-base-content" on:change={(e)=>{findLanguageCode(e)}}>
                {#each languagesArray as lang}
                    <option value={lang} selected={lang == "English"}>{lang}</option>
                {/each}
              </select>
            <input type="text" bind:value={language} placeholder="Language" disabled class="input input-bordered text-base-content input-primary w-full" />
            <button class="btn btn-primary" on:click={handleSubmit}>Upload</button>
        </div>
        {/if}
    </div>
    <div class="flex flex-col grow gap-4 md:pr-4 md:pl-0 px-4">
            <div class="card w-full bg-base-200 shadow-inner">
                <div class="card-body  text-base-content">
                    
                    <div class="card-title flex justify-between">
                        <h1>
                            Files
                        </h1>
                        <h1>
                            ${(durations?.reduce((a, b) => a + b, 0) / 60 * 0.06).toFixed(4)}
                        </h1>
                    </div>
                    <div class="divider"></div>
                    <div class="flex flex-wrap gap-4">
                        {#each files.accepted as file, index (file.name)}
                            <div class="indicator">
                                <div class="indicator-item">
                                    <button class="btn btn-square btn-xs btn-error" on:click={()=>{clearUpload(index)}}>
                                        <div class="w-6">
                                            <MdRemoveCircleOutline></MdRemoveCircleOutline>
                                        </div>
                                    </button>
                                </div> 
                                {#await read(file)}
                                <div class="progress w-full"></div>
                                {:then output} 
                                
                                    <div class="card w-full p-4 aspect-square bg-base-100">
                                     <div class="h-full w-full flex flex-col">
                                        <div>{file.name}</div>
                                        <div>{formatBytes(file.size)}</div>
                                        <div>Estimated cost: ${(durations[index] / 60 * 0.06).toFixed(4)}</div>
                                        <audio 
                                            bind:duration={durations[index]}
                                            controls 
                                            class="grow">
                                            <source src={output.result} type={output.type}/>
                                        </audio>
                                        </div>
                                    </div>
                                {/await}
                            </div> 
                        {/each}
                    </div>
                </div>
            </div>
    </div>
    {:else}
    <div class="flex flex-col max-w-full grow md:w-[0px] h-full max-h-full relative px-4 gap-4">
        <div class="navbar bg-base-200 shadow-lg shadow-lg rounded-md gap-4"> 
            <input type="text" placeholder="Transcription name" class="grow input text-base-content w-full" bind:value={transcriptionName}/>
            <button class="btn btn-secondary text-secondary-content" on:click={saveTranscription}>Save</button>
        </div>
        <div class="max-w-full grow p-4 gap-4 flex flex-col relative h-full bg-base-300 rounded-md overflow-y-auto">
                <div class="flex items-center">
                    <div class="flex grow flex-col gap-4">
                        <div class = "stats-vertical stats shadow md:stats-horizontal self-start">
                            <div class="stat">
                                <div class="stat-figure text-secondary">
                                    <div class="w-10">
                                        <MdAccessTime />
                                    </div>
                                </div>
                                <div class="stat-title">Total Duration</div>
                                <div class="stat-value text-secondary text-sm">
                                    {toSeconds(durations?.reduce((a, b) => a + b, 0))}
                                </div>
                            </div>
                            <div class="stat">
                                <div class="stat-figure text-accent">
                                    <div class="w-10">
                                        <MdAttachMoney />
                                    </div>
                                </div>
                                <div class="stat-title">Estimated Cost</div>
                                <div class="stat-value text-accent text-sm">
                                    ${(durations?.reduce((a, b) => a + b, 0)/60 * 0.06).toFixed(4)}
                                </div>
                            </div>
                        </div>
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
                <div class="flex items-center">
                    
                    <div class="flex grow flex-col">
                    </div>
                </div>

                {#each segments as segment}
                    <div class="flex items-center p-4 bg-base-100 rounded-box shadow-inner">
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
            
		    <div class="" bind:this={scrollToDiv} />
        </div>
    </div>
    
    {/if}
</div>