import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export const getFinancialInsights = async (expenses: any[], subscriptions: any[], sharedExpenses: any[] = []) => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    As a premium financial advisor, analyze the following financial data.
    IMPORTANT: Do NOT just list totals. EXPLAIN the "why" and "how".
    
    Tasks:
    1. Explain spending behavior: Identify if costs increased or decreased and WHY (e.g., "Food increased due to 3 large Blinkit orders last week").
    2. Subscription Optimization: Suggest shared plans or cancellations for specific services.
    3. Debt Strategy: Recommend how to settle shared dues efficiently.
    4. Provide 3 highly actionable, context-aware tips.

    Data:
    Expenses: ${JSON.stringify(expenses)}
    Subscriptions: ${JSON.stringify(subscriptions)}
    Pending Shared Debts: ${JSON.stringify(sharedExpenses)}
    
    All amounts are in Indian Rupees (₹). Use a professional, decision-driven tone.
    Format your response in clear, bulleted markdown sections.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insights at this time. Please try again later.";
  }
};

export const chatWithAI = async (message: string, context: any) => {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are FinVision AI, an intelligent financial assistant. 
    You have access to the user's financial context: ${JSON.stringify(context)}.
    Answer questions about spending, debts, and savings with precision.
    All amounts are in Indian Rupees (₹). Always use the ₹ symbol when referring to money.
    Be concise, helpful, and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: message,
      config: { systemInstruction }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to my brain right now. Can you ask again?";
  }
};
