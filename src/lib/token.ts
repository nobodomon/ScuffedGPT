
import { getFirestore, addDoc, setDoc, doc, getDoc,increment } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import moment from 'moment';

let firestore = getFirestore()
let auth = getAuth()

export async function updateTokenUsed(token: any, model: any, params: any){
	const userRef = doc(firestore, "Users", auth.currentUser!!.uid);

    switch (model) {
        case "whisper-1":
            await updateWhisperTokenUsed(token, params);
            break;
        case "gpt-3.5-turbo-0125":
            await updateGPT35TurboTokenUsed(token, params);
            break;
        case "gpt-4-turbo-preview":
            await updateGPT4TokenUsed(token, params);
            break;
        case "gpt-4-vision-preview":
            await updateGPT4VisionTokenUsed(token, params);
            break;
        case "gpt-4o":
            await updateGPT4oTokenUsed(token, params);
            break;
        case "dall-e-2":
            await updateImageTokenUsed(token, params);
            break;
        case "dall-e-3":
            await updateDalle3TokenUsed(token, params);
            break;
    }
}


const updateWhisperTokenUsed = async (token: [number], params: any) => {
    const aggregatedToken = token.reduce((a: number, b: number) => a + b, 0);

    const userRef = doc(firestore, "Users", auth.currentUser!!.uid,"Usage", moment().format('YYYY-MM'));
    await setDoc(userRef, {
        transcriptionTime: increment(aggregatedToken)
    }, {merge: true})
}

const updateGPT35TurboTokenUsed = async (token: GPT4Token, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid,"Usage", moment().format('YYYY-MM'));
    await setDoc(userRef, {
        gpt3PromptTokensUsed: increment(token.prompt),
        gpt3AnswerTokensUsed: increment(token.answer)
    }, {merge: true})
}

interface GPT4Token {
    prompt: number;
    answer: number;
}

const updateGPT4TokenUsed = async (token: GPT4Token, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid,"Usage", moment().format('YYYY-MM'));
    await setDoc(userRef, {
        gpt4PromptTokensUsed: increment(token.prompt),
        gpt4AnswerTokensUsed: increment(token.answer)
    }, {merge: true})
}

const calculateImageToken = (width: number, height:number) => {
    const area = width * height;

    const basePricingArea = 512 * 512;

    const token = Math.ceil(area / basePricingArea);

    return 170 * token;
}

const updateGPT4VisionTokenUsed = async (token: any, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid,"Usage", moment().format('YYYY-MM'));
    let imageTokensUsed = 0;
    for(const reference of params){
        imageTokensUsed += calculateImageToken(reference.fileDimensions.width, reference.fileDimensions.height);
    }

    await setDoc(userRef, {
        gpt4PromptTokensUsed: increment(token.prompt),
        gpt4AnswerTokensUsed: increment(token.answer),
        gpt4VisionTokensUsed: increment(imageTokensUsed)
        
    }, {merge: true})

}

const updateGPT4oTokenUsed = async (token: any, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid,"Usage", moment().format('YYYY-MM'));
    let imageTokensUsed = 0;
    for(const reference of params){
        imageTokensUsed += calculateImageToken(reference.fileDimensions.width, reference.fileDimensions.height);
    }

    await setDoc(userRef, {
        gpt4oPromptTokensUsed: increment(token.prompt),
        gpt4oAnswerTokensUsed: increment(token.answer),
        gpt4oVisionTokensUsed: increment(imageTokensUsed)
        
    }, {merge: true})

}


const updateImageTokenUsed = async (token: any, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid,"Usage", moment().format('YYYY-MM'));
    switch(params.size) {
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

const updateDalle3TokenUsed = async (token: any, params: any) => {
    const userRef = doc(firestore, "Users", auth.currentUser!!.uid,"Usage", moment().format('YYYY-MM'));
    switch(params.size) {
        case "1024x1024": 
            if(params.quality === "standard"){
                await setDoc(userRef, {
                    "1024x1024-dalle-3": increment(token)
                    }, {merge: true})
                }
            else{
                await setDoc(userRef, {
                    "1024x1024HD-dalle-3": increment(token)
                    }, {merge: true})
            }
            break;
        case "1792x1024":
            if(params.quality === "standard"){
                await setDoc(userRef, {
                    "1792x1024-dalle-3": increment(token)
                    }, {merge: true})
                }
            else{
                await setDoc(userRef, {
                    "1792x1024HD-dalle-3": increment(token)
                    }, {merge: true})
            }
            break;
        case "1024x1792":
            if(params.quality === "standard"){
                await setDoc(userRef, {
                    "1024x1792-dalle-3": increment(token)
                    }, {merge: true})
                }
            else{
                await setDoc(userRef, {
                    "1024x1792HD-dalle-3": increment(token)
                    }, {merge: true})
            }
            break;

        default:{
            return;
        }
    }
}