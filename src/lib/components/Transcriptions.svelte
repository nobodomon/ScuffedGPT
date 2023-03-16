<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    import {transcriptionsCollection,auth} from "../../firebase";
    import MdDeleteSweep from 'svelte-icons/md/MdDeleteSweep.svelte';
    import {getAuth} from "firebase/auth";

    import {onSnapshot,getDocs, deleteDoc, setDoc, doc, addDoc, query, where} from "firebase/firestore";
	import type { ChatCompletionRequestMessage } from "openai"

    const dispatch = createEventDispatcher();
    
    export let transcriptions : any[] = [];

    let loading : boolean = true;

    export let currTranscriptionID : string;

    const dispatcher = createEventDispatcher();

    function switchTranscription(transcriptionId : any) {
        currTranscriptionID = transcriptionId;
        dispatch("transcriptionSwitch", {
            transcriptionId: transcriptionId,
        });
    }

    function newTranscription() {
        currTranscriptionID = "";
        dispatch("transcriptionNew", {
            transcriptionId: "",
        });
    }

    function deleteTranscription(transcriptionId : any) {
        deleteDoc(doc(transcriptionsCollection, transcriptionId));
        dispatch("transcriptionDelete", {
        });
    }

    function onNewThread() {
        dispatch("onNewThread", {
            id: "",
            pageType: "transcribe",
        });
    }

    
    function truncate(str : string, len : number) {
        return (str.length > len) ? str.substr(0, len-1) + '...' : str;
    };

    function transform (text : string) {
        if(text.length > 15){
            return truncate(text, 15);
        }else{
            return text;
        }
    }
    
    function deleteAllTranscriptions() {
        dispatch("deleteAllTranscriptions", {
        });
    }

</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div tabindex="0" class="collapse collapse-arrow border border-base-300 bg-neutral rounded-box">
    
     <input type="checkbox" class="peer" /> 
    <div class="collapse-title text-xl font-medium">
      Transcriptions
    </div>
    <div class="collapse-content bg-neutral flex flex-cols items-stretch gap-4 menu "> 
        {#if transcriptions == null}
		<progress class="progress progress-primary w-56"></progress>
        {:else}
        
        <div class="w-full flex items-center gap-1">
            <button class="btn btn-outline btn-primary grow" on:click={() => onNewThread()}>
                New Transcription
            </button>
            <button class="btn btn-ghost btn-square" on:click|preventDefault={()=> deleteAllTranscriptions()}>
                <div class="w-10 p-2">
                    <MdDeleteSweep />
                </div>
            </button>
        </div>
        {#each transcriptions as transcription}
            {#if transcription.id === currTranscriptionID}
            <div class="w-full flex items-center gap-1">
                <button class="btn btn-primary grow " on:click|preventDefault={() => switchTranscription(transcription)}>
                    {transcription.name  == "" ? transform(transcription.text) : transform(transcription.name)}
                </button>
                <button class="btn btn-ghost btn-square" on:click|preventDefault={()=> deleteTranscription(transcription.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            {:else}
            <div class="w-full flex items-center gap-1">
                <button class="btn btn-outline btn-primary grow  overflow-hidden" on:click|preventDefault={() => switchTranscription(transcription.id)}>
                    {transcription.name  == "" ? transform(transcription.text?? "Unnamed Transcript") : transform(transcription.name)}
                </button>
                <button class="btn btn-ghost btn-square" on:click|preventDefault={()=> deleteTranscription(transcription.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            {/if}
        {/each}
    {/if}
    </div>
</div>