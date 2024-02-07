<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {threadsCollection,auth} from "../../firebase";
    import {getAuth} from "firebase/auth";

    import {onSnapshot,getDocs, deleteDoc, setDoc, updateDoc, doc, addDoc, query, where, orderBy, or} from "firebase/firestore";

    import MdDeleteSweep from 'svelte-icons/md/MdDeleteSweep.svelte';
	import { redirect } from "@sveltejs/kit"
	import { deleteObject, getStorage, ref } from "@firebase/storage"

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
                const q = query(threadsCollection, or(where('users', '==', auth.currentUser?.uid), where('users', 'array-contains', auth.currentUser?.uid)), orderBy("updatedOn", "desc"));
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
        const toDelete = threads.find((thread) => thread.id === threadId);
        if(typeof toDelete.users == 'string'){
            await deleteDoc(doc(threadsCollection, threadId));
            return;
        }
        if(toDelete.users.length > 1){
            const newUsers = toDelete.users.filter((user : string) => user !== auth.currentUser?.uid);
            await updateDoc(doc(threadsCollection, threadId), {
                users: newUsers,
            });
        }else{
            await deleteDoc(doc(threadsCollection, threadId));
            for(let i = 0; i < toDelete.imageList.length; i++){
                const image = toDelete.imageList[i];
                const storage = getStorage();
                const storageRef = ref(storage, `threadImages/${image.newname}`);
                await deleteObject(storageRef);
            }
        }
    }
    
    function onDeleteAll(){
        const q = query(threadsCollection, where("users", "==", auth.currentUser?.uid));

        onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref);
            });
        });

        const q2 = query(threadsCollection, where("users", "array-contains", auth.currentUser?.uid));
        
        onSnapshot(q2, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if(doc.data().users.length > 1){
                    const newUsers = doc.data().users.filter((user : string) => user !== auth.currentUser?.uid);
                    updateDoc(doc.ref, {
                        users: newUsers,
                    });
                }else{
                    deleteDoc(doc.ref);
                }
            });
        });

        dispatch("deleteAll", {
            id: "",
            pageType: "chat",
        });
    }
    
    const getShortName = (model: string) => {
        switch(model){
            case "gpt-3.5-turbo-1106":
                return "GPT-3.5";
            case "gpt-4-turbo-preview":
                return "GPT-4";
            case "gpt-4-vision-preview":
                return "GPT-4 Vision";
        }
    }

</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div tabindex="0" class="collapse collapse-arrow shadow-inner bg-base-200">
     <input type="checkbox" class="peer" /> 
    <div class="collapse-title text-xl font-medium">
      <div class="flex w-full justify-between items-center">
        Threads
      </div>
    </div>
    <div class="collapse-content grid grid-flow-row auto-rows-fr gap-4 menu "> 
        {#if threads == null}
		<progress class="progress progress-primary w-56"></progress>
        {:else}
        
        
        <div class="w-full flex items-center gap-1">
            <a class="btn btn-base grow" href={"/chat"}>
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
                    
                    {#if typeof thread.users == 'string'}
                    
                            
                        <a class={"btn grow overflow-hidden bg-base-neutral"} href="{`/chat/${thread.id}`}">
                            {thread.name  == "" ? "Unnamed Thread" : transform(thread.name)}
                        </a>
                    {:else}
                    <div class="indicator grow">
                        {#if thread.users.length > 1}
                        <span class="indicator-item badge badge-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                        </span>
                        {/if}

                        <span class="indicator-item indicator-top indicator-center badge badge-primary">
                            {getShortName(thread.model)}
                        </span>
                        <a class={"btn grow overflow-hidden bg-base-neutral"} href="{`/chat/${thread.id}`}">
                            {thread.name  == "" ? "Unnamed Thread" : transform(thread.name)}
                        </a>
                    </div>
                    {/if}
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