<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    import {threadsCollection,auth} from "../../firebase";
    import {getAuth} from "firebase/auth";

    import {onSnapshot,getDocs, deleteDoc, setDoc, doc, addDoc, query, where} from "firebase/firestore";

    import MdDeleteSweep from 'svelte-icons/md/MdDeleteSweep.svelte';

    const dispatch = createEventDispatcher();
    
    export let threads : any[] = [];

    let loading : boolean = true;

    export let currThreadID : string;

    const dispatcher = createEventDispatcher();

    function switchThread(threadId : any) {
        currThreadID = threadId;
        console.log("Switching to thread: " + threadId);
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

    function onNewThread() {
        dispatch("onNewThread", {
            id: "",
            pageType: "chat",
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

    function deleteAllThreads() {
        console.log("Deleting all threads");
        dispatch("deleteAllThreads", {
        });
    }

</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div tabindex="0" class="collapse collapse-arrow shadow-inner bg-base-200 rounded-box">
    
     <input type="checkbox" class="peer" /> 
    <div class="collapse-title text-xl font-medium">
      Threads
    </div>
    <div class="collapse-content grid grid-flow-row auto-rows-fr gap-4 menu "> 
        {#if threads == null}
		<progress class="progress progress-primary w-56"></progress>
        {:else}
        <div class="w-full flex items-center gap-1">
            <button class="btn btn-base grow" on:click={() => onNewThread()}>
                New Thread
            </button>
            <button class="btn btn-ghost btn-square" on:click|preventDefault={()=> deleteAllThreads()}>
                <div class="w-10 p-2">
                    <MdDeleteSweep />
                </div>
            </button>
        </div>
        <div class="divider"></div>
        {#each threads as thread}
            <div class="w-full bordered flex items-center gap-1">
                <button class={"btn grow " + (thread.id === currThreadID ? "btn-primary":"btn-base-100")} on:click|preventDefault={() => switchThread(thread.id)}>
                    {thread.name  == "" ? "Unnamed Thread" : transform(thread.name)}
                </button>
                <button class="btn btn-ghost btn-square text-base-content" on:click|preventDefault={()=> deleteThread(thread.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x stroke-base-content" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="" fill="none" stroke-linecap="round" stroke-linejoin="round">
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