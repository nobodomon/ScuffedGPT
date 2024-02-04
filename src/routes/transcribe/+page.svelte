<script lang="ts">
    import Transcribe from '$lib/components/Transcribe.svelte'
import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<Transcribe></Transcribe>