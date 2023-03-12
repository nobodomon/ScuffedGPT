<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    import {threadsCollection,auth} from "../../firebase";
    import {getAuth} from "firebase/auth";

    import {onSnapshot,getDocs, deleteDoc, setDoc, doc, addDoc, query, where} from "firebase/firestore";

    const dispatch = createEventDispatcher();
    
    let threads : any[] = [];

    export let currThreadID : string;

    const dispatcher = createEventDispatcher();

    function callDispatch(thread : any) {
        currThreadID = thread.id;
        dispatch("threadswitch", {
            threadID: thread.id,
            threadName: thread.name,
            messages: thread.messages
        });
    }

    function callDispatchNew() {
        currThreadID = "";
        dispatch("threadswitchNew", {
            threadID: "",
            threadName: "",
            messages: []
        });
    }

    export let uid : string;

    // function handleThreadClick(thread : any) {
    //     console.log("Thread clicked: " + thread.id);
    //     dispatch("threadclick", {
    //         threadID: thread.id,
    //         threadName: thread.name,
    //         messages: thread.messages
    //     });
    // }

    onMount(async () => {
        const user = getAuth().currentUser;
        if(user != null){
            uid = user.uid;
            threads = await load();
        }
    });



    export async function load () {
        let threads : any[] = [];
        console.log("Loading threads for user: " + uid)
        const q = query(threadsCollection, where("users", "==", uid));
        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
            threads.push({
                id: doc.id,
                name: doc.data().name,
                messages: doc.data().messages
            });
        });

        return threads;
    }

    export async function refreshThreads() {
        threads = await load();
    }

    async function deleteThread(thread : any) {
        console.log("Deleting thread: " + thread.id);
        await deleteDoc(doc(threadsCollection, thread.id));
        threads = await load();

        if(currThreadID === thread.id) {
            callDispatchNew();
        }else{
            callDispatch(thread);
        }
    }

</script>

<div class="grid grid-cols-1 gap-4 menu ">
    <button class="btn btn-outline btn-primary" on:click={() => callDispatch({id: "", name: "", messages: []})}>
        New Thread
    </button>
        {#each threads as thread}
        {#if thread.id === currThreadID}
        <div class="w-full bordered flex items-center gap-1">
            <button class="btn btn-primary grow" on:click={() => callDispatch(thread)}>
                {thread.name  == "" ? "Unnamed Thread" : thread.name}
            </button>
            <button class="btn btn-ghost btn-square" on:click={()=> deleteThread(thread)}>
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
        {:else}
        <div class="w-full flex items-center gap-1">
            <button class="btn btn-outline btn-primary grow" on:click={() => callDispatch(thread)}>
                {thread.name  == "" ? "Unnamed Thread" : thread.name}
            </button>
            <button class="btn btn-ghost btn-square" on:click={()=> deleteThread(thread)}>
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
        {/if}
    {/each}
</div>