<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    import {threadsCollection,auth} from "../../firebase";
    import {getAuth} from "firebase/auth";

    import {onSnapshot,getDocs, deleteDoc, setDoc, doc, addDoc, query, where} from "firebase/firestore";
	import type { ChatCompletionRequestMessage } from "openai"

    const dispatch = createEventDispatcher();
    
    export let threads : any[] = [];

    let loading : boolean = true;

    export let currThreadID : string;

    const dispatcher = createEventDispatcher();

    function switchThread(threadId : any) {
        currThreadID = threadId;
        dispatch("threadswitch", {
            threadID: threadId,
        });
    }

    function newThread() {
        currThreadID = "";
        dispatch("threadswitchNew", {
            threadID: "",
        });
    }

    function deleteThread(threadId : any) {
        deleteDoc(doc(threadsCollection, threadId));
        dispatch("threaddelete", {
        });
    }
    

</script>

<div class="grid grid-cols-1 gap-4 menu ">
    {#if threads == null}
		<progress class="progress progress-primary w-56"></progress>
    {:else}
        <button class="btn btn-outline btn-primary" on:click={() => newThread()}>
            New Thread
        </button>
        {#each threads as thread}
            {#if thread.id === currThreadID}
            <div class="w-full bordered flex items-center gap-1">
                <button class="btn btn-primary grow" on:click={() => switchThread(thread.id)}>
                    {thread.name  == "" ? "Unnamed Thread" : thread.name}
                </button>
                <button class="btn btn-ghost btn-square" on:click={()=> deleteThread(thread.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            {:else}
            <div class="w-full flex items-center gap-1">
                <button class="btn btn-outline btn-primary grow" on:click={() => switchThread(thread.id)}>
                    {thread.name  == "" ? "Unnamed Thread" : thread.name}
                </button>
                <button class="btn btn-ghost btn-square" on:click={()=> deleteThread(thread.id)}>
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