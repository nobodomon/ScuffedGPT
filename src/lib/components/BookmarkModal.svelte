<script lang="ts">
	import { createEventDispatcher } from "svelte"


    export let showModal: boolean = false;
    export let index : number = -1;
    let bookmarkName: string = "";

    const dispatch = createEventDispatcher();

    function handleBookmark() {
        dispatch("saveBookmark", {
            index: index,
            name: bookmarkName
        });
    }
    
    function closeBookmarkModal() {
        bookmarkName = "";
        dispatch("closeModal");
    }

</script>

{#if showModal}
<dialog class="modal modal-bottom sm:modal-middle" id='bookmarkModal'>
    <div class="modal-box">
      <h3 class="font-bold text-lg text-base-content">Enter a bookmark name</h3>
      <div class="divider"></div>
      <input type="text" maxlength="15" bind:value={bookmarkName} class="input input-bordered w-full text-base-content" placeholder="Bookmark name" />
      <div class="modal-action">
        <label for="my-modal-6" class="btn" on:click={closeBookmarkModal}>Close</label>
        <button class="btn btn-primary" on:click={handleBookmark}>Save</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
{/if}