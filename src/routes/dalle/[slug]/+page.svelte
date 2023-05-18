<script lang="ts">
    import type { PageData } from '../$types';
    import ImageChat from '$lib/components/ImageChat.svelte';
    export let data: any;


    $: threadId = data.thread;

    export function load(){
        return {
            preserve: false
        }
    }
</script>

<ImageChat threadID={threadId.threadId}></ImageChat>