
import { getFirestore, addDoc, setDoc, doc, getDoc,increment } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

let firestore = getFirestore()
let auth = getAuth()

export async function updateTokenUsed(token: any, model: any, params: any){
	const userRef = doc(firestore, "Users", auth.currentUser!!.uid);

    switch (model) {
        case "whisper-1":
            await updateWhisperTokenUsed(token, params);
            break;
        case "gpt-3.5-turbo":
            await updateGPT35TurboTokenUsed(token, params);
            break;
        case "gpt-4":
            await updateGPT4TokenUsed(token, params);
            break;
        case "DALL-E":
            await updateImageTokenUsed(token, params);
            break;
    }
}


const updateWhisperTokenUsed = async (token: [number], params: any) => {
    const aggregatedToken = token.reduce((a: number, b: number) => a + b, 0);

    const userRef = doc(firestore, "Users", auth.currentUser!!.uid);
    await setDoc(userRef, {
        transcriptionTime: increment(aggregatedToken)
    }, {merge: true})
}

const updateGPT35TurboTokenUsed = async (token: GPT4Token, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid);
    await setDoc(userRef, {
        tokensUsed: increment(token.prompt + token.answer)
    }, {merge: true})
}

interface GPT4Token {
    prompt: number;
    answer: number;
}

const updateGPT4TokenUsed = async (token: GPT4Token, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid);
    await setDoc(userRef, {
        gpt4PromptTokensUsed: increment(token.prompt),
        gpt4AnswerTokensUsed: increment(token.answer)
    }, {merge: true})
}

const updateImageTokenUsed = async (token: any, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid);
    switch(params) {
        case "256x256": 
            await setDoc(userRef, {
                "256x256": increment(token)
                }, {merge: true})
            break;

        case "512x512":
            await setDoc(userRef, {
                "512x512": increment(token)
                }, {merge: true})
            break;

        case "1024x1024":
            await setDoc(userRef, {
                "1024x1024": increment(token)
                }, {merge: true})
            break;

        default:{
            return;
        }
    }
}