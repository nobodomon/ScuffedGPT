<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import {getAuth} from "firebase/auth";
    import {collection, doc, getFirestore, onSnapshot} from "firebase/firestore";
	import moment from "moment"
	import { toSeconds } from "../../utils"
    import {Bar} from "svelte-chartjs";
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
    } from 'chart.js';

    Chart.register(
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale
    );

    let usageMetrics: UsageMetrics[] = []
    let uid: string = ""
    let user: any = {}

    let date: (string|undefined)[] = []
    let viewingDate: string |undefined = "";

    let viewingStats: any = {}
    let prevMonthStats: any = {}

	const firestore = getFirestore()

    class UsageMetrics {
        date: string | undefined = ""
        gpt4PromptTokensUsed: number = 0;
        gpt4AnswerTokensUsed: number = 0;
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


        constructor(doc: any) {
            this.date = doc?.date ?? ""
            this.gpt4PromptTokensUsed = doc?.gpt4PromptTokensUsed ?? 0
            this.gpt4AnswerTokensUsed = doc?.gpt4AnswerTokensUsed ?? 0
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
        }
    }


    onMount(async () => {
        const auth = getAuth();
        auth.onAuthStateChanged(async (user : any) => {
            if (user) {
                uid = user.uid
                user = user

                const usageMetricsCollection = collection(firestore, "Users", uid, "Usage");

                onSnapshot(usageMetricsCollection, (querySnapshot : any) => {
                    querySnapshot.forEach((doc : any) => {
                        usageMetrics = [
                            ...usageMetrics,
                            new UsageMetrics({
                                ...doc.data(),
                                date: doc.id
                            })
                        ]
                    });

                    
                    usageMetrics.sort((a: UsageMetrics, b: UsageMetrics) => {
                        return a.date?.localeCompare(b.date ?? "") ?? 0;
                    });
                    date = usageMetrics.map((item: UsageMetrics) => {
                        return item.date
                    })
                   
                    viewingDate = date[0]

                    viewingStats = usageMetrics.find((item: UsageMetrics) => item.date == viewingDate)

                    if(usageMetrics.indexOf(viewingStats) == usageMetrics.length - 1){
                        prevMonthStats = new UsageMetrics({})
                    }else{
                        prevMonthStats = new UsageMetrics(usageMetrics.find((item: UsageMetrics) => item.date == moment(viewingDate, "YYYY-MM").subtract(1, "months").format("YYYY-MM"))?? {})
                        prevMonthStats.date = moment(viewingDate, "YYYY-MM").subtract(1, "months").format("YYYY-MM");
                    }
                });
            }
        });
    })

    const onChangeViewingDate = () => {
        viewingStats = usageMetrics.filter((item: UsageMetrics) => item.date == viewingDate);

        if(usageMetrics.indexOf(viewingStats) == usageMetrics.length - 1){
            prevMonthStats = new UsageMetrics({})
        }else{
            prevMonthStats = new UsageMetrics(usageMetrics.find((item: UsageMetrics) => item.date == moment(viewingDate, "YYYY-MM").subtract(1, "months").format("YYYY-MM"))?? {})
            prevMonthStats.date = moment(viewingDate, "YYYY-MM").subtract(1, "months").format("YYYY-MM");
        }
    }

    const calculatePercentage = (current: number, prev: number) => {
        if(prev == undefined || isNaN(prev) || prev == 0){
            return "0%"
        }
        return `${((current - prev) / prev) * 100}%`
    }

    const getImageCost = (item: UsageMetrics) =>{
        const dallE2Cost = ((item["256x256"] * 0.016) + (item["512x512"] * 0.018) + (item["1024x1024"] * 0.02))
        const dallE3Cost = ((item["1024x1024-dalle-3"] * 0.04) + (item["1024x1792-dalle-3"] * 0.08) + (item["1792x1024-dalle-3"] * 0.08))
        const dallE3HDCost = ((item["1024x1024-dalle-3-hd"] * 0.08) + (item["1024x1792-dalle-3-hd"] * 0.12) + (item["1792x1024-dalle-3-hd"] * 0.12))
        
        return {
            dallE2Usage: dallE2Cost,
            dallE3Usage: dallE3Cost,
            dallE3HDUsage: dallE3HDCost
        }
    }
        
    const calculateTotalCost = (item:UsageMetrics) =>{
        const durationCost = (item.transcriptionTime/60 * 0.006).toFixed(4);
        const gpt3PromptCost = (item.gpt3PromptTokensUsed/1000 * 0.0005).toFixed(4);
        const gpt3AnswerCost = (item.gpt3AnswerTokensUsed/1000 * 0.0015).toFixed(4);

        const gpt4PromptCost = (item.gpt4PromptTokensUsed/1000 * 0.01).toFixed(4);
        const gpt4AnswerCost = (item.gpt4AnswerTokensUsed/1000 * 0.03).toFixed(4);

        const s_cost = (item["256x256"] * 0.016).toFixed(4);
        const m_cost = (item["512x512"] * 0.018).toFixed(4);
        const l_cost = (item["1024x1024"] * 0.02).toFixed(4);

        const dalle3_standard_square_cost = (item["1024x1024-dalle-3"] * 0.04).toFixed(4);
        const dalle3_standard_landscape_cost = (item["1024x1792-dalle-3"] * 0.08).toFixed(4);
        const dalle3_standard_portrait_cost = (item["1792x1024-dalle-3"] * 0.08).toFixed(4);

        const dalle3_hd_square_cost = (item["1024x1024-dalle-3-hd"] * 0.08).toFixed(4);
        const dalle3_hd_landscape_cost = (item["1024x1792-dalle-3-hd"] * 0.12).toFixed(4);
        const dalle3_hd_portrait_cost = (item["1792x1024-dalle-3-hd"] * 0.12).toFixed(4);

        let total = (
            parseFloat(durationCost) + 
            parseFloat(gpt3PromptCost) + 
            parseFloat(gpt3AnswerCost) + 
            parseFloat(gpt4PromptCost) + 
            parseFloat(gpt4AnswerCost) + 
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

        return total
    }
    

</script>

<div class="flex flex-col w-full px-4 pb-4 items-stretch gap-4 grow max-h-full relative h-[0px] overflow-y-auto">
    <div class="flex items-center justify-between w-full p-4">
        <h1 class="text-xl font-bold">{`Usage Metrics - ${moment(viewingDate, "YYYY-MM").format("MMM YYYY")}`}</h1>
        <select bind:value={viewingDate} class="select select-primary select-md" on:change={onChangeViewingDate}>
            {#each date as item}
                <option value={item}>{moment(item,"YYYY-MM").format("MMM YYYY")}</option>
            {/each}
        </select>
    </div>
    <div class="grid md:grid-cols-[minmax(0,1fr),minmax(0,1fr)] grid-cols-1 w-full items-stretch">
        <!-- Stats Column-->
        <div class="flex flex-col gap-4 p-4 items-stretch">
            <h1 class="text-xl font-bold">GPT 4 Usage</h1>
            <!-- GPT 4 Usage -->
            <div class="stats shadow">
                <div class="stat">
                  <div class="stat-figure text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      
                  </div>
                  <div class="stat-title">GPT-4 Prompts</div>
                  <div class="stat-value text-primary">{viewingStats["gpt4PromptTokensUsed"]}</div>
                  <div class="stat-desc">{
                     `${calculatePercentage(viewingStats["gpt4PromptTokensUsed"], prevMonthStats["gpt4PromptTokensUsed"])} of last month`
                  }</div>
                </div>
                
                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                    </div>
                    <div class="stat-title">GPT-4 Answers</div>
                    <div class="stat-value text-secondary">{viewingStats.gpt4AnswerTokensUsed}</div>
                    <div class="stat-desc">{
                        `${calculatePercentage(viewingStats["gpt4AnswerTokensUsed"], prevMonthStats["gpt4AnswerTokensUsed"])} of last month`}
                    </div>
                </div>
                
                <div class="stat">
                  <div class="stat-figure text-secondary">
                        
                    </div>
                    <div class="stat-value">Est Cost</div>
                    <div class="stat-title">{
                        `$${((viewingStats["gpt4PromptTokensUsed"]/1000 * 0.01) + (viewingStats['gpt4AnswerTokensUsed']/1000 * 0.03)).toFixed(4)} USD`    
                    }</div>
                    <div class="stat-desc text-secondary">
                        {`${calculatePercentage((viewingStats["gpt4PromptTokensUsed"]/1000 * 0.01) + (viewingStats['gpt4AnswerTokensUsed']/1000 * 0.03), (prevMonthStats["gpt4PromptTokensUsed"]/1000 * 0.01) + (prevMonthStats['gpt4AnswerTokensUsed']/1000 * 0.03))} of last month`}
                    </div>
                </div>
                
            </div>
            <h1 class="text-xl font-bold">GPT 3 Usage</h1>
            <!-- GPT 3 Usage-->
            <div class="stats shadow">
                <div class="stat">
                  <div class="stat-figure text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      
                  </div>
                  <div class="stat-title">GPT-3 Prompts</div>
                  <div class="stat-value text-primary">{viewingStats["gpt3PromptTokensUsed"]}</div>
                  <div class="stat-desc">{
                     `${calculatePercentage(viewingStats["gpt3PromptTokensUsed"], prevMonthStats["gpt3PromptTokensUsed"])} of last month`
                  }</div>
                </div>
                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                    </div>
                    <div class="stat-title">GPT-3 Answers</div>
                    <div class="stat-value text-secondary">{viewingStats["gpt3AnswerTokensUsed"]}</div>
                    <div class="stat-desc">{
                        `${calculatePercentage(viewingStats["gpt3AnswerTokensUsed"], prevMonthStats["gpt3AnswerTokensUsed"])} of last month`}
                    </div>
                </div>
                
                <div class="stat">
                  <div class="stat-figure text-secondary">
                        
                    </div>
                    <div class="stat-value">Est Cost</div>
                    <div class="stat-title">{
                        `$${((viewingStats["gpt3PromptTokensUsed"]/1000 * 0.01) + (viewingStats['gpt3AnswerTokensUsed']/1000 * 0.03)).toFixed(4)} USD`    
                    }</div>
                    <div class="stat-desc text-secondary">
                        {`${calculatePercentage((viewingStats["gpt3PromptTokensUsed"]/1000 * 0.0005) + (viewingStats["gpt3AnswerTokensUsed"]/1000 * 0.0015), ((prevMonthStats["gpt3PromptTokensUsed"]/1000 * 0.0005) + prevMonthStats["gpt3AnswerTokensUsed"]/1000 * 0.0015))} of last month`}
                    </div>
                </div>
            </div>
            <!-- Whisper Usage-->
            <h1 class="text-xl font-bold">Transcription Usage</h1>
            <div class="stats shadow">
                <div class="stat">
                  <div class="stat-figure text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                  </div>
                  <div class="stat-title">Whisper Usage</div>
                  <div class="stat-value text-primary">{toSeconds(viewingStats["transcriptionTime"])}</div>
                  <div class="stat-desc">{
                     `${calculatePercentage(viewingStats["transcriptionTime"], prevMonthStats["transcriptionTime"])} of last month`
                  }</div>
                </div>
                
                <div class="stat">
                  <div class="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <div class="stat-value">Est Cost</div>
                    <div class="stat-title">{
                        `$${((viewingStats["transcriptionTime"]/60 * 0.006)).toFixed(4)} USD`    
                    }</div>
                    <div class="stat-desc text-secondary">
                        {`${calculatePercentage((viewingStats["transcriptionTime"]/60 * 0.006),(prevMonthStats["transcriptionTime"]/60 * 0.006))} of last month`}
                    </div>
                </div>
            </div>
            <!-- Image Usage-->
            <h1 class="text-xl font-bold">Image Generation Usage</h1>
            <div class="flex gap-4 overflow-auto pt-4 items-stretch">
                <div class="indicator grow">
                    <div class="indicator-item indicator-top indicator-center badge badge-primary">
                        Dall-E 2 Standard
                    </div>
                    <div class="stats stats-vertical shadow grow">
      
                        <div class="stat">
                          <div class="stat-title">256x256 Images Generated</div>
                            <div class="stat-value text-primary">{
                                viewingStats["256x256"]
                            }</div>
                            <div class="stat-desc">{
                                `${calculatePercentage(viewingStats["256x256"], prevMonthStats["256x256"])} of last month`
                            }</div>
                        </div>
                        
                        <div class="stat">
                          <div class="stat-title">512x512 Images Generated</div>
                            <div class="stat-value text-primary">{
                                viewingStats["512x512"]
                            }</div>
                            <div class="stat-desc">{
                                `${calculatePercentage(viewingStats["512x512"], prevMonthStats["512x512"])} of last month`
                            }</div>
                        </div>
                        
                        <div class="stat">
                          <div class="stat-title">1024x1024 Images Generated</div>
                            <div class="stat-value text-primary">{
                                viewingStats["1024x1024"]
                            }</div>
                            <div class="stat-desc">{
                                `${calculatePercentage(viewingStats["1024x1024"], prevMonthStats["1024x1024"])} of last month`
                            }</div>
                        </div>
                    </div>
                </div>
                <div class="indicator grow">
                    <div class="indicator-item indicator-top indicator-center badge badge-secondary">
                        Dall-E 3 Standard
                    </div>
                    <div class="stats stats-vertical shadow grow">
                        <div class="stat">
                          <div class="stat-title">1024x1024 Images Generated</div>
                          <div class="stat-value text-secondary">{
                                viewingStats["1024x1024-dalle-3"]
                            }</div>
                          <div class="stat-desc">
                                {
                                    `${calculatePercentage(viewingStats["1024x1024-dalle-3"], prevMonthStats["1024x1024-dalle-3"])} of last month`
                                }
                          </div>
                        </div>
                        
                        <div class="stat">
                          <div class="stat-title">1024x1792 Images Generated</div>
                          <div class="stat-value text-secondary">{
                                viewingStats["1024x1792-dalle-3"]
                            }</div>
                          <div class="stat-desc">{
                                `${calculatePercentage(viewingStats["1024x1792-dalle-3"], prevMonthStats["1024x1792-dalle-3"])} of last month`
                            }</div>
                        </div>
                        
                        <div class="stat">
                            <div class="stat-title">1792x1024 Images Generated</div>
                          <div class="stat-value text-secondary">{
                                viewingStats["1792x1024-dalle-3"]
                            }</div>
                          <div class="stat-desc">{
                                `${calculatePercentage(viewingStats["1792x1024-dalle-3"], prevMonthStats["1792x1024-dalle-3"])} of last month`
                            }</div>
                        </div>
                    </div>
                </div>
                <div class="indicator grow">
                    <div class="indicator-item indicator-top indicator-center badge badge-accent">
                        Dall-E 3 HD
                    </div>
                    <div class="stats stats-vertical shadow grow">
                        <div class="stat">
                            <div class="stat-title">1024x1024 Images Generated</div>
                            <div class="stat-value text-accent">{
                                viewingStats["1024x1024-dalle-3-hd"]
                            }</div>
                            <div class="stat-desc">{
                                `${calculatePercentage(viewingStats["1024x1024-dalle-3-hd"], prevMonthStats["1024x1024-dalle-3-hd"])} of last month`
                            }</div>
                        </div>
                        
                        <div class="stat">
                            <div class="stat-title">1024x1792 Images Generated</div>
                            <div class="stat-value text-accent">{
                                viewingStats["1024x1792-dalle-3-hd"]
                            }</div>
                            <div class="stat-desc">{
                                `${calculatePercentage(viewingStats["1024x1792-dalle-3-hd"], prevMonthStats["1024x1792-dalle-3-hd"])} of last month`
                            }</div>
                        </div>
                        
                        <div class="stat">
                            <div class="stat-title">1792x1024 Images Generated</div>
                            <div class="stat-value text-accent">{
                                viewingStats["1792x1024-dalle-3-hd"]
                            }</div>
                            <div class="stat-desc">{
                                `${calculatePercentage(viewingStats["1792x1024-dalle-3-hd"], prevMonthStats["1792x1024-dalle-3-hd"])} of last month`
                            }</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <div class="stat-value">Est Cost</div>
                    <div class="stat-title">{
                        `$${getImageCost(viewingStats).dallE2Usage.toFixed(4)} USD`    
                    }</div>
                    <div class="stat-desc text-primary">
                        {`${calculatePercentage(getImageCost(viewingStats).dallE2Usage,getImageCost(prevMonthStats).dallE2Usage)} of last month`}
                    </div>
                </div>
                
                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <div class="stat-value">Est Cost</div>
                    <div class="stat-title">{
                        `$${getImageCost(viewingStats).dallE3Usage.toFixed(4)} USD`    
                    }</div>
                    <div class="stat-desc text-secondary">
                        {`${calculatePercentage(getImageCost(viewingStats).dallE3Usage,getImageCost(prevMonthStats).dallE3Usage)} of last month`}
                    </div>
                </div>
                <div class="stat">
                  <div class="stat-figure text-accent">
                        
                    </div>
                    <div class="stat-value">Est Cost</div>
                    <div class="stat-title">{
                        `$${((getImageCost(viewingStats).dallE3HDUsage)).toFixed(4)} USD`    
                    }</div>
                    <div class="stat-desc text-accent">
                        {`${calculatePercentage(getImageCost(viewingStats).dallE3HDUsage,getImageCost(prevMonthStats).dallE3HDUsage)} of last month`}
                    </div>
                </div>
            </div>
        </div>

        <!-- Usage Graph Column-->
        <div class="flex flex-col gap-4 p-4 items-stretch">
            <h1 class="text-xl font-bold">Usage Graph</h1>
            <div class="card shadow grow">
                <div class="card-body">
                    <div class="chart-container grow">
                        <Bar
                            data = {
                                {
                                    labels: date.map((item) => moment(item, "YYYY-MM").format("MMM YYYY")),
                                    datasets: [
                                        {
                                            label: "Total Costs ($USD)",
                                            data: usageMetrics.map((item) => calculateTotalCost(item)),
                                            backgroundColor: date.map((item,index)=>{
                                                if(index == 0){
                                                    return 'oklch(0.6569 0.196 275.75)'
                                                }else{
                                                    return 'oklch(0.6569 0.196 275.75 / 0.5)'
                                                }
                                            }),
                                        }
                                    ]
                                }
                            }
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                            }}
                            width={"100%"}
                            height={"100%"}
                        >

                        </Bar>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>