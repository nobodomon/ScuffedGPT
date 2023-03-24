<script lang="ts">
    import Transcribe from '$lib/components/Transcribe.svelte'
    import type { PageData } from './$types';
    
    export let data: any;
    $: transcription = data.transcription;
    console.log(transcription)
</script>

<Transcribe transcriptionId={transcription.transcriptionId}></Transcribe>