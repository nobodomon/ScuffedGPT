<script lang="ts">
    import { Highlight, HighlightAuto, LineNumbers } from "svelte-highlight";

    import "svelte-highlight/styles/horizon-dark.css"
    import MdContentCopy from 'svelte-icons/md/MdContentCopy.svelte'

    export let code : String;

    let multiline = code.includes('\n');
    let lines : String[] = [];
    if(multiline) {
        lines = code.split('\n');
    }else{
    }
    // split code into list of lines
    let language = code.split('\n')[0]
    let codePart = code.split('\n').splice(1).join('\n');

    function handleCopyCode() {
        navigator.clipboard.writeText(codePart);
    }
</script>

<div class="mockup-code my-4 sm:max-w-full max-w-sm">
    <div class="w-full flex justify-between p-4 border-b border-base-100 border-b-2">
        <span class="font-bold capitalize italic">{language}</span>
        <button class="btn btn-ghost btn-sm flex gap-4" on:click={handleCopyCode}>
            <div class="w-5">
            <MdContentCopy />
            </div>
            Copy
        </button>
    </div>
    <HighlightAuto code={codePart} let:highlighted>
        <LineNumbers {highlighted} />
    </HighlightAuto>
</div>