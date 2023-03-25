<script lang="js">
    import { Highlight, HighlightAuto, LineNumbers } from "svelte-highlight";

    import "svelte-highlight/styles/horizon-dark.css"
    import MdContentCopy from 'svelte-icons/md/MdContentCopy.svelte'
    import * as plantumlEncoder from 'plantuml-encoder'

    // split code into list of lines
    
    export let text;
    export let lang;

    function handleCopyCode() {
        navigator.clipboard.writeText(text);
    }

    const getLanguage = () =>{
        return lang;
    }

    const getCodePart = () =>{
        console.log("code", text);
        return text;
    }

    const detectPlantUML = ()=>{ 
        if(text.startsWith("@startuml")){
            return true;
        }

        if(text.startsWith("@enduml")){
            return true;
        }
        return false;
    }
</script>

<div class="mockup-code my-4 self-stretch">
    <div class="w-full flex justify-between p-4 border-b border-base-100 border-b-2 items-center">
        <span class="font-bold capitalize italic"></span>
        
        <div class="flex gap-4">
        {#if detectPlantUML()}
            <a class="btn btn-ghost btn-sm" target="_blank" href={'http://www.plantuml.com/plantuml/img/' + plantumlEncoder.encode(text)}>View</a>
        {/if}
        <button class="btn btn-ghost btn-sm flex gap-4" on:click={handleCopyCode}>
            <div class="w-5">
            <MdContentCopy />
            </div>
            Copy
        </button>
        </div>
    </div>
    
    <HighlightAuto code={text} let:highlighted>
        <LineNumbers {highlighted} />
    </HighlightAuto>
</div>