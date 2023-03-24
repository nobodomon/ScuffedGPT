<script lang="ts">
    import type { PageData } from './$types';
    import Chat from '$lib/components/Chat.svelte';

    export function load(){
        return {
            preserve: false
        }
    }
</script>

<Chat threadID={""}></Chat>