export default class UsageMetrics {
    date: string | undefined = ""
    gpt4PromptTokensUsed: number = 0;
    gpt4AnswerTokensUsed: number = 0;
    gpt4VisionTokensUsed: number = 0;
    gpt4oPromptTokensUsed: number = 0;
    gpt4oAnswerTokensUsed: number = 0;
    gpt4oVisionTokensUsed: number = 0;
    gpt3PromptTokensUsed: number = 0;
    gpt3AnswerTokensUsed: number = 0;
    transcriptionTime: number = 0;
    "256x256": number = 0
    "512x512": number = 0
    "1024x1024": number = 0
    "1024x1024-dalle-3": number = 0
    "1024x1792-dalle-3": number = 0
    "1792x1024-dalle-3": number = 0

    "1024x1024-dalle-3-hd": number = 0
    "1024x1792-dalle-3-hd": number = 0
    "1792x1024-dalle-3-hd": number = 0

    totalCost: number = 0;


    constructor(doc: any) {
        console.log(doc);
        this.date = doc?.date ?? ""
        this.gpt4PromptTokensUsed = doc?.gpt4PromptTokensUsed ?? 0
        this.gpt4AnswerTokensUsed = doc?.gpt4AnswerTokensUsed ?? 0
        this.gpt4VisionTokensUsed = doc?.gpt4VisionTokensUsed ?? 0
        this.gpt4oPromptTokensUsed = doc?.gpt4oPromptTokensUsed ?? 0
        this.gpt4oAnswerTokensUsed = doc?.gpt4oAnswerTokensUsed ?? 0
        this.gpt4oVisionTokensUsed = doc?.gpt4oVisionTokensUsed ?? 0
        this.gpt3PromptTokensUsed = doc?.gpt3PromptTokensUsed ?? 0
        this.gpt3AnswerTokensUsed = doc?.gpt3AnswerTokensUsed ?? 0
        this.transcriptionTime = doc?.transcriptionTime ?? 0
        this["256x256"] = doc["256x256"] ?? 0
        this["512x512"] = doc["512x512"] ?? 0
        this["1024x1024"] = doc["1024x1024"] ?? 0
        this["1024x1024-dalle-3"] = doc["1024x1024-dalle-3"] ?? 0
        this["1024x1792-dalle-3"] = doc["1024x1792-dalle-3"] ?? 0
        this["1792x1024-dalle-3"] = doc["1792x1024-dalle-3"] ?? 0
        this["1024x1024-dalle-3-hd"] = doc["1024x1024-dalle-3-hd"] ?? 0
        this["1024x1792-dalle-3-hd"] = doc["1024x1792-dalle-3-hd"] ?? 0
        this["1792x1024-dalle-3-hd"] = doc["1792x1024-dalle-3-hd"] ?? 0

        this.totalCost = this.calculateTotalCost();

    }

    calculateTotalCost = () =>{
        const durationCost = (this.transcriptionTime/60 * 0.006).toFixed(4);
        const gpt3PromptCost = (this.gpt3PromptTokensUsed/1000 * 0.0005).toFixed(4);
        const gpt3AnswerCost = (this.gpt3AnswerTokensUsed/1000 * 0.0015).toFixed(4);

        const gpt4PromptCost = (this.gpt4PromptTokensUsed/1000 * 0.01).toFixed(4);
        const gpt4AnswerCost = (this.gpt4AnswerTokensUsed/1000 * 0.03).toFixed(4);
        const gpt4VisionTokensCost = (this.gpt4VisionTokensUsed/1000 * 0.01).toFixed(4);

        const gpt4oPromptCost = (this.gpt4oPromptTokensUsed/1000 * 0.005).toFixed(4);
        const gpt4oAnswerCost = (this.gpt4oAnswerTokensUsed/1000 * 0.015).toFixed(4);
        const gpt4oVisionTokensCost = (this.gpt4VisionTokensUsed/1000 * 0.001275).toFixed(4);

        const s_cost = (this["256x256"] * 0.016).toFixed(4);
        const m_cost = (this["512x512"] * 0.018).toFixed(4);
        const l_cost = (this["1024x1024"] * 0.02).toFixed(4);

        const dalle3_standard_square_cost = (this["1024x1024-dalle-3"] * 0.04).toFixed(4);
        const dalle3_standard_landscape_cost = (this["1024x1792-dalle-3"] * 0.08).toFixed(4);
        const dalle3_standard_portrait_cost = (this["1792x1024-dalle-3"] * 0.08).toFixed(4);

        const dalle3_hd_square_cost = (this["1024x1024-dalle-3-hd"] * 0.08).toFixed(4);
        const dalle3_hd_landscape_cost = (this["1024x1792-dalle-3-hd"] * 0.12).toFixed(4);
        const dalle3_hd_portrait_cost = (this["1792x1024-dalle-3-hd"] * 0.12).toFixed(4);

        let total = (
            parseFloat(durationCost) + 
            parseFloat(gpt3PromptCost) + 
            parseFloat(gpt3AnswerCost) + 
            parseFloat(gpt4PromptCost) + 
            parseFloat(gpt4AnswerCost) + 
            parseFloat(gpt4VisionTokensCost) +
            parseFloat(gpt4oPromptCost) +
            parseFloat(gpt4oAnswerCost) +
            parseFloat(gpt4oVisionTokensCost) +
            parseFloat(s_cost) + 
            parseFloat(m_cost) +
            parseFloat(l_cost) +
            parseFloat(dalle3_standard_square_cost) +
            parseFloat(dalle3_standard_landscape_cost) +
            parseFloat(dalle3_standard_portrait_cost) +
            parseFloat(dalle3_hd_square_cost) +
            parseFloat(dalle3_hd_landscape_cost) +
            parseFloat(dalle3_hd_portrait_cost)
        );


        return total;
    }
}