<script lang="js">
    export let id;

    export let label;

    let current = window.location.href.split('/').pop();

    $: active = current === id;
</script>


<a class={"btn grow " + (active? "btn-primary":"btn-base-100")} href="{`/chat/${id}`}">
    {label}
</a>