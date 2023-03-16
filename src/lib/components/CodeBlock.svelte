<script lang="ts">
    import { HighlightAuto, LineNumbers } from "svelte-highlight";

    import github from "svelte-highlight/styles/github-dark.css"

    export let code : String;

    let multiline = code.includes('\n');
    let lines : String[] = [];
    if(multiline) {
        lines = code.split('\n');
    }else{
    }
    // split code into list of lines
</script>

<svelte:head>
    {@html github}
</svelte:head>

<div class="mockup-code my-4 min-w-full">
    <HighlightAuto code={code} let:highlighted>
        <LineNumbers {highlighted} />
    </HighlightAuto>
</div>