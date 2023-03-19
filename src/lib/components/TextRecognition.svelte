<script lang="ts">
	import { createEventDispatcher } from 'svelte'
    import Tesseract from 'tesseract.js';

    export let showModal = false;
    export let image: File;
    let output = '';
    let loading = false;
    let progress = 0;

    $: showModal == true && ocrText(image);

    const dispatch = createEventDispatcher();

    async function ocrText (image: File) {
        loading = true;
        const { data: { text } } = await Tesseract.recognize(image, 'eng', { logger: m => 
            progress=m.progress
        });
        console.log(text);
        output = text;
        loading = false;
        return text;
    }

    const closeModal = () => {
        progress = 0;
        loading = false;
        output = '';
        dispatch('closeModal');
    }

    const useAsPrompt = async () => {

        dispatch('useAsPrompt',{
            text: splitText(output).join('\n')
        });
    }

    function splitText(text: string) {
        const splitText = text.split('\n').filter((line) => line.length > 0);
        console.log(splitText);
        return splitText;
    }

</script>


{#if showModal}
<div class="modal modal-open modal-bottom sm:modal-middle">
    <div class="modal-box w-1/2 max-w-11/12">
      <h3 class="font-bold text-lg">Converting image to text...</h3>
      <div class="divider"></div>
      <div class="grid md:grid-cols-2 grid-cols-1 gap-4">
        <img src={image.toString()} alt="img-preview" />
            {#await ocrText(image)}
            <progress class="progress progress-primary" value={progress * 100} max="100"></progress>
            {:then text}
            <div>
                {#each splitText(text) as line}
                    <p class="text-xs">{line}</p>
                {/each}
            </div>
            {/await}
      </div>
      <div class="modal-action">
        <button class="btn btn-ghost" on:click={closeModal}>Close</button>
        <button class="btn btn-primary" disabled={loading} on:click={useAsPrompt}>Use as prompt</button>
      </div>
    </div>
</div>
{/if}



