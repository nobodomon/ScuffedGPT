<script lang="ts">
    import { Highlight, HighlightAuto, LineNumbers } from "svelte-highlight";

    import "svelte-highlight/styles/horizon-dark.css"
    import MdContentCopy from 'svelte-icons/md/MdContentCopy.svelte'
    import * as plantumlEncoder from 'plantuml-encoder'

    export let code : String;
    export let loading: boolean;
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

    const detectPlantUML = ()=>{ 
        var code = getCodePart();
        if(code.startsWith("@startuml")){
            return true;
        }

        if(code.startsWith("@enduml")){
            return true;
        }

        if(getLanguage().toLowerCase() === "plantuml"){
            return true;
        }

        return false;
    }
</script>

<div class="mockup-code my-4 self-stretch">
    <div class="w-full flex justify-between p-4 border-b border-base-100 border-b-2 items-center">
        <span class="font-bold capitalize italic">{getLanguage()}</span>
        
        <div class="flex gap-4">
        {#if !loading}
            {#if detectPlantUML()}
                <a class="btn btn-ghost btn-sm" target="_blank" href={'http://www.plantuml.com/plantuml/img/' + plantumlEncoder.encode(getCodePart())}>View</a>
            {/if}
        {/if}
        <button class="btn btn-ghost btn-sm flex gap-4" on:click={handleCopyCode}>
            <div class="w-5">
            <MdContentCopy />
            </div>
            Copy
        </button>
        </div>
    </div>
    <HighlightAuto code={code.slice(getLanguage().length).trim()} let:highlighted>
        <LineNumbers {highlighted} />
    </HighlightAuto>
</div>