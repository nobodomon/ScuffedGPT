import type { PageServerLoad } from './$types';
export async function load({params}) {

    const transcription = {
        transcriptionId: params.slug,
    }

    return{
        transcription
    };
}
