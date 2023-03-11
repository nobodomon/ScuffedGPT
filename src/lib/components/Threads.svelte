<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    import {threadsCollection,auth} from "../../firebase";
    import {getAuth} from "firebase/auth";

    import {onSnapshot,getDocs, setDoc, doc, addDoc, query, where} from "firebase/firestore";

    const dispatch = createEventDispatcher();
    
    let threads : any[] = [];

    let currThreadID : string;

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



    async function load () {
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
</script>

<div class="grid grid-cols-1 gap-4 menu ">
    <button class="btn btn-outline btn-primary" on:click={() => callDispatch({id: "", name: "", messages: []})}>
        New Thread
    </button>
    {#each threads as thread}
        {#if thread.id === currThreadID}
            <button class="btn btn-primary" on:click={() => callDispatch(thread)}>
                {thread.name  == "" ? "Unnamed Thread" : thread.name}
            </button>
        {:else}
            <button class="btn btn-outline btn-primary" on:click={() => callDispatch(thread)}>
                {thread.name  == "" ? "Unnamed Thread" : thread.name}
            </button>
        {/if}
    {/each}
</div>