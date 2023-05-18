import type { PageServerLoad } from './$types';
import { getDoc, doc, getFirestore } from "firebase/firestore";
export async function load({params}) {

    const thread = {
        threadId: params.slug,
    }

    return{
        thread
    };
}
