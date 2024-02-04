<script lang="ts">
    import type { PageData } from '../$types';
    import Chat from '$lib/components/Chat.svelte';
    export let data: any;


    $: threadId = data.thread;

    export function load(){
        return {
            preserve: false
        }
    }
</script>

<Chat threadID={threadId.threadId}></Chat>