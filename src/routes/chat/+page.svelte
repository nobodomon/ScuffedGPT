<script lang="ts">
    import type { PageData } from './$types';
    import Chat from '$lib/components/Chat.svelte';
    export let data: PageData;


    console.log(data);
</script>

<Chat></Chat>