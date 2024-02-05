<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {imageThreadsCollection,auth} from "../../firebase";
    import {getAuth} from "firebase/auth";

    import {onSnapshot,getDocs, deleteDoc, setDoc, doc, addDoc, query, where, orderBy} from "firebase/firestore";

    import MdDeleteSweep from 'svelte-icons/md/MdDeleteSweep.svelte';
	import { redirect } from "@sveltejs/kit"

    const dispatch = createEventDispatcher();
    
    let threads : any[] = [];
    export let currId : string = "";

    $: _currId = currId;

    $: isCurrent = (threadId : string) => {
        return window.location.href.split('/').pop() === threadId;
    }


    onMount(async () => {
        const auth = getAuth();
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const q = query(imageThreadsCollection, where("users", "==", auth.currentUser?.uid), orderBy("updatedOn", "desc"));
                onSnapshot(q, (querySnapshot) => {
                    threads = [];
                    querySnapshot.forEach((doc) => {
                        threads.push({
                            id: doc.id,
                            ...doc.data(),
                        });
                    });
                });
            } else {
                threads = [];
            }
        });
    });

    function truncate(str : string, len : number) {
        return (str.length > len) ? str.substr(0, len-1) + '...' : str;
    };

    function transform (text : string) {
        if(text.length > 22){
            return truncate(text, 22);
        }else{
            return text;
        }
    }

    async function deleteThread(threadId : any) {
        await deleteDoc(doc(imageThreadsCollection, threadId));
        // navigate("/", {
        //     replace: true,
        // });
    }
    
    function onDeleteAll(){
        const q = query(imageThreadsCollection, where("users", "==", auth.currentUser?.uid));

        onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref);
            });
        });

        dispatch("deleteAll", {
            id: "",
            pageType: "chat",
        });
    }
    

</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div tabindex="0" class="collapse collapse-arrow shadow-inner bg-base-200">
     <input type="checkbox" class="peer" /> 
    <div class="collapse-title text-xl font-medium">
      <div class="flex w-full justify-between items-center">
        Image Threads 
        <div class="badge badge-primary">beta</div>
      </div>
    </div>
    <div class="collapse-content grid grid-flow-row auto-rows-fr gap-4 menu "> 
        {#if threads == null}
		<progress class="progress progress-primary w-56"></progress>
        {:else}
        
        
        <div class="w-full flex items-center gap-1">
            <a class="btn btn-base grow" href={"/dalle"}>
                New Thread
            </a>
            <button class="btn btn-ghost btn-square" on:click|preventDefault={()=> onDeleteAll()}>
                <div class="w-10 p-2">
                    <MdDeleteSweep />
                </div>
            </button>
        </div>
        <div class="divider"></div>
            {#each threads as thread}
                <div class="w-full bordered flex items-center gap-1">
                    <a class={"btn grow overflow-hidden bg-base-neutral"} href="{`/dalle/${thread.id}`}">
                        {thread.name  == "" ? "Unnamed Thread" : transform(thread.name)}
                    </a>
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