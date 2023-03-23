<script lang="ts">
    import { Highlight, HighlightAuto, LineNumbers } from "svelte-highlight";

    import "svelte-highlight/styles/horizon-dark.css"
    import MdContentCopy from 'svelte-icons/md/MdContentCopy.svelte'

    export let code : String;
    // split code into list of lines

    console.log(code);

    function handleCopyCode() {
        navigator.clipboard.writeText(getCodePart());
    }

    const getLanguage = () =>{
        if(code.startsWith(" ")){
            return "";
        }else{
            return code.split('\n')[0];
        }
    }

    const getCodePart = () =>{
        return code.slice(getLanguage().length).trim();
    }
</script>

<div class="mockup-code my-4 sm:max-w-full max-w-sm">
    <div class="w-full flex justify-between p-4 border-b border-base-100 border-b-2">
        <span class="font-bold capitalize italic">{getLanguage()}</span>
        <button class="btn btn-ghost btn-sm flex gap-4" on:click={handleCopyCode}>
            <div class="w-5">
            <MdContentCopy />
            </div>
            Copy
        </button>
    </div>
    <HighlightAuto code={code.slice(getLanguage().length).trim()} let:highlighted>
        <LineNumbers {highlighted} />
    </HighlightAuto>
</div>