<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    import {transcriptionsCollection,auth} from "../../firebase";
    import MdDeleteSweep from 'svelte-icons/md/MdDeleteSweep.svelte';
    import {getAuth} from "firebase/auth";

    import {onSnapshot,getDocs, deleteDoc, setDoc, doc, addDoc, query, where, orderBy} from "firebase/firestore";
	import type { ChatCompletionRequestMessage } from "openai"
	import { toSeconds } from "../../utils"
	import { navigate } from "svelte-navigator"

    const dispatch = createEventDispatcher();
    
    export let transcriptions : any[] = [];

    

    onMount(async () => {
        const auth = getAuth();
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const q = query(transcriptionsCollection, where("user", "==", auth.currentUser?.uid), orderBy("date", "desc"));
                onSnapshot(q, (querySnapshot) => {
                    transcriptions = [];
                    querySnapshot.forEach((doc) => {
                        transcriptions.push({
                            id: doc.id,
                            ...doc.data(),
                        });
                    });
                });
            } else {
                transcriptions = [];
            }
        });
    });


    async function deleteTranscription(transcriptionId : any) {
        await deleteDoc(doc(transcriptionsCollection, transcriptionId));
        navigate("/", {
            replace: true,
        });
    }


    
    function truncate(str : string, len : number) {
        return (str.length > len) ? str.substr(0, len-1) + '...' : str;
    };

    function transform (text : string) {
        if(text.length >= 22){
            return truncate(text, 22);
        }else{
            return text;
        }
    }
    

    function onDeleteAll(){
        const q = query(transcriptionsCollection, where("user", "==", auth.currentUser?.uid));

        onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref);
            });
        });

        dispatch("deleteAll", {
            id: "",
            pageType: "transcribe",
        });
    }

</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div tabindex="0" class="collapse collapse-arrow shadow-inner bg-base-200">
    
    <input type="checkbox" class="peer" /> 
    <div class="collapse-title text-xl font-medium">
      Transcriptions
    </div>
    <div class="collapse-content bg-base flex flex-cols items-stretch gap-4 menu "> 
        {#if transcriptions == null}
		<progress class="progress progress-primary w-56"></progress>
        {:else}
        
        <div class="w-full flex items-center gap-1">
            <a class="btn btn-base grow" href="/transcribe">
                New Transcription
            </a>
            <button class="btn btn-ghost btn-square" on:click|preventDefault={()=> onDeleteAll()}>
                <div class="w-10 p-2">
                    <MdDeleteSweep />
                </div>
            </button>
        </div>
        <div class="divider"></div>
        {#each transcriptions as transcription}
            <div class="w-full flex items-center gap-1">
                <a class={"btn grow overflow-hidden bg-base-neutral"} href="{`/transcribe/${transcription.id}`}">
                    {transcription.name  == "" ? transform(transcription.text?? "Unnamed Transcript") : transform(transcription.name)}
                </a>
                <button class="btn btn-ghost btn-square" on:click|preventDefault={()=> deleteTranscription(transcription.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x  stroke-base-content" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        {/each}
    {/if}
    </div>
</div>