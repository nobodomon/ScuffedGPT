<script lang="ts">
	import { createEventDispatcher } from 'svelte'
    import {ulid} from 'ulidx';
    import {getDownloadURL, getStorage, ref, uploadBytesResumable} from 'firebase/storage';
    import Tesseract from 'tesseract.js';
    export let image: File | undefined;

    export let allowImageInput : boolean;
    let output = '';
    let loading = false;
    let progress = 0;
    let uploadStarted = false;
    let uploadProgress = 0;

    let imageWidth = 0;
    let imageHeight = 0;

    const dispatch = createEventDispatcher();

    async function ocrText (image: File) {
        loading = true;

        let reader = await read(image);

        const { data: { text } } = await Tesseract.recognize(reader.result, 'eng', { logger: m => 
            progress=m.progress
        });
        //console.log(text);
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

        await ocrText(image!!);
        
        dispatch('useAsPrompt',{
            text: splitText(output).join('\n')
        });

        output = '';
        closeModal();
    }

    function splitText(text: string) {
        const splitText = text.split('\n').filter((line) => line.length > 0);
        return splitText;
    }

    const useAsImage = async() => {

        await uploadToStorage(image!!, async (
            downloadURL : string, 
            originalFileName: string,
            fileType: string,
            newFileName: string,
            fileDimensions: any)=>{

            await dispatch('useAsImage', {
                fileURL: downloadURL,
                originalFileName: originalFileName,
                newFileName: newFileName,
                fileType: fileType,
                fileDimensions: fileDimensions
            });
            closeModal();
        });
    }

    const uploadToStorage = async (file: File, callback: Function) => {
        const storage = getStorage();
        const randomFileID = ulid();
        console.log(file.name);


        const extension = file.name.split('.').pop();
        //const fileNameNoExt = file.name.split('.').slice(0, -1).join('.');
        const newFileName = `${randomFileID}-${file.name}`;
        const fileRef = ref(storage,'threadImages/' + `${newFileName}`);

        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadProgress = progress;
            uploadStarted = true;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
                case 'paused':
                    console.log('Upload is paused');
                    break;
                case 'running':
                    console.log('Upload is running');
                    break;
            }
        }, (error: any) => {
            console.log(error);
        },() => {
            // Handle successful uploads on complete
            uploadStarted = false;
            getDownloadURL(uploadTask.snapshot.ref).then( async  (downloadURL :string) => {
                console.log('File available at', downloadURL);
                
                await callback(downloadURL, file.name, extension, newFileName , {
                    width: imageWidth,
                    height: imageHeight
                });
            });
        });
    }


	async function read (file: any) {
        return new Promise<any>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                var img = new Image();

                img.onload = function() {
                    imageWidth = img.width;
                    imageHeight = img.height;
                }

                img.src = reader.result as string;

                resolve(reader);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        })
    }

</script>
<dialog id="textRecognitionModal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box">
        <h3 class="font-bold text-lg text-base-content">Convert To Text?</h3>
        <div class="divider"></div>
        <div class="grid lg:grid-cols-2 grid-cols-1 gap-4">
            {#if image}
                {#if image?.type.includes('image') }
                    {#await read(image)}
                        <progress class="progress progress-primary" value={progress * 100} max="100"></progress>
                    {:then reader}
                        <img src={reader.result} alt={image.name} class="rounded-lg w-full h-64 object-contain"/>
                    {/await}
                {:else}
                    <div class="flex items-center justify-center w-full h-64 bg-base-200 rounded-lg">
                        <p class="text-base-content">{image.name}</p>
                    </div>
                {/if}
                {#if output == ''}
                    <btn class="btn btn-primary" on:click={ocrText(image)}>Extract Text</btn>
                {:else}

                    <div class="progress">
                        <div class="progress-bar" style="width: {progress*100}%"></div>
                    </div>
                    {#await ocrText(image)}
                    <progress class="progress progress-primary" value={progress * 100} max="100"></progress>
                    {:then text}
                    <div>
                        {#each splitText(text) as line}
                            <p class="text-xs text-base-content">{line}</p>
                        {/each}
                    </div>
                    {/await}
                {/if}
            {:else}
                <p class="text-base-content">No image to display</p>
            {/if}
        </div>
        {#if uploadStarted}
            <progress class="progress progress-primary" value={uploadProgress} max="100"></progress>
        {/if}
        <div class="modal-action">
            <button class="btn btn-ghost text-base-content" on:click={closeModal}>Close</button>
            {#if allowImageInput}
            
                <button class="btn btn-primary" disabled={!allowImageInput} on:click={useAsImage}>Use As Image</button>
            {:else}
                <div class="tooltip" data-tip="You can only use this as image if you use the GPT 4 Vision Model">
                    <button class="btn btn-primary" disabled={!allowImageInput} on:click={useAsImage}>Use As Image</button>
                </div>
            {/if}
            <button class="btn btn-primary" disabled={loading} on:click={useAsPrompt}>Use as prompt using OCR</button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>



