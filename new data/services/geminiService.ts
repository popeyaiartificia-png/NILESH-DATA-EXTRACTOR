
import { GoogleGenAI } from "@google/genai";
import { CompanyInfo, AVAILABLE_FIELDS } from "../types";

export class GeminiService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async extractCompanyData(inputs: string[], fieldIds: string[], retryCount = 0): Promise<CompanyInfo[]> {
    // GUIDELINE: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    // Creating a fresh instance inside the method to ensure it uses the latest key from state.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const fieldDescriptions = fieldIds.map(id => {
      const f = AVAILABLE_FIELDS.find(field => field.id === id);
      return `- ${id} (${f?.label || id})`;
    }).join('\n');

    const prompt = `
      Perform advanced research for these entities: ${inputs.join(', ')}

      STRICT PROCESSING LOGIC:
      1. For each input, find the OFFICIAL company website.
      2. Extract precisely these fields as requested:
${fieldDescriptions}

      FALLBACK VALUES:
      - Use 'WEBSITE NOT FOUND' if no official site is identified.
      - Use 'NO EMAIL' for missing contact addresses.
      - Use 'NO DATA' for other missing fields.

      RULES:
      - No hallucinations. Use actual web data.
      - Emails must be verified from the domain.
      - Return the data as a JSON array of objects inside a markdown code block.
    `;

    try {
      // Use the googleSearch tool for real-time web grounding as required for current research tasks.
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // GUIDELINE: Access response.text property directly (not a method call)
      const text = response.text || '';
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
      const jsonStr = jsonMatch[1] || text;
      
      let parsedData: any[] = [];
      try {
        parsedData = JSON.parse(jsonStr.trim());
      } catch (e) {
        // Cleaning logic in case model adds conversational prefix or suffix
        const cleaned = jsonStr.replace(/^[^{]*\[/, '[').replace(/][^}]*$/, ']');
        parsedData = JSON.parse(cleaned);
      }

      // GUIDELINE: Extract URLs from groundingChunks to display sources on the web app.
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const webSources = groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];

      return parsedData.map(item => ({
        companyName: item.companyName || 'Unknown',
        officialWebsite: item.officialWebsite || 'WEBSITE NOT FOUND',
        email1: item.email1 || 'NO EMAIL',
        email2: item.email2 || 'NO EMAIL',
        industry: item.industry || 'NO DATA',
        location: item.location || 'NO DATA',
        linkedin: item.linkedin || 'NO DATA',
        phone: item.phone || 'NO DATA',
        foundedYear: item.foundedYear || 'NO DATA',
        companySize: item.companySize || 'NO DATA',
        sources: webSources
      }));
    } catch (error: any) {
      // Robust error handling for quota and service availability
      const errorData = error?.error || error;
      const status = errorData?.status || error?.status;
      const code = errorData?.code || error?.code;
      const message = (errorData?.message || error?.message || "").toLowerCase();
      
      const isQuotaError = status === 'RESOURCE_EXHAUSTED' || code === 429 || message.includes('429') || message.includes('quota');
      const isRetryableError = isQuotaError || status === 'INTERNAL' || status === 'UNAVAILABLE' || code === 500 || code === 503;

      // Exponential backoff to handle rate limits gracefully
      if (isRetryableError && retryCount < 5) {
        const waitTime = Math.pow(2, retryCount) * 3000 + (Math.random() * 1000);
        console.warn(`Retry ${retryCount + 1}/5: ${message}. Waiting ${Math.round(waitTime)}ms...`);
        await this.delay(waitTime);
        return this.extractCompanyData(inputs, fieldIds, retryCount + 1);
      }

      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
