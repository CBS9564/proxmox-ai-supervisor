
import { GoogleGenAI, Chat, GenerateContentResponse, GenerateContentParameters } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';
import { ChatMessage, InstanceData, Alert } from '../types';

let ai: GoogleGenAI | null = null;
let currentChat: Chat | null = null;

const initializeGemini = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set for Gemini.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const startOrContinueChat = async (
  userMessage: string,
  history: ChatMessage[], 
  systemInstruction?: string,
  instanceData?: InstanceData | null, // Will likely be null
  alerts?: Alert[] // Will likely be empty
): Promise<string> => {
  const genAI = initializeGemini();

  let promptContext = "Proxmox VE Context: No specific live instance data is available in this frontend-only application. Answer based on general Proxmox VE knowledge or provided user query.\n";

  if (instanceData) { // This block may not be hit often if instanceData is always null
    promptContext = "Current Proxmox Instance Data Snapshot (limited view):\n";
    instanceData.nodes.forEach(node => {
      promptContext += `Node ${node.name}: CPU ${node.cpu.averageLoad}%, Mem ${node.memory.percentage}%, PVE Ver ${node.pveVersion}\n`;
    });
    promptContext += "\n";
  }

  if (alerts && alerts.length > 0) { // This block may not be hit often
    promptContext += "Active Alerts (summary):\n";
    alerts.forEach(alert => {
      promptContext += `- ${alert.severity}: ${alert.message}\n`;
    });
    promptContext += "\n";
  }
  
  const fullPrompt = `${promptContext}User query: ${userMessage}`;

  if (!currentChat) {
    type ChatConfigType = GenerateContentParameters['config'];
    
    const modelOperationConfig: ChatConfigType = {};
    if (systemInstruction) {
      modelOperationConfig.systemInstruction = systemInstruction;
    }

    currentChat = genAI.chats.create({
      model: GEMINI_TEXT_MODEL,
      config: Object.keys(modelOperationConfig).length > 0 ? modelOperationConfig : undefined
    });
  }
  
  try {
    const response: GenerateContentResponse = await currentChat.sendMessage({ message: fullPrompt });
    return response.text;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.message && error.message.includes('API_KEY_INVALID')) { 
         return "Error: The Gemini API key is invalid or not configured correctly. Please check your API_KEY setting.";
    }
    return "Sorry, I encountered an error trying to process your request. Please check the console for details.";
  }
};

export const generateProxmoxReportSummary = async (
  instanceData: InstanceData | null, // Will likely be null
  alerts: Alert[] // Will likely be empty
): Promise<string> => {
  const genAI = initializeGemini();
  let prompt = `You are a Proxmox VE monitoring assistant. 
  Generate a concise summary and potential recommendations based on general Proxmox VE best practices or any high-level information provided.
  If specific data is given, use it. Otherwise, provide general advice. Be brief.
  Focus on actionable advice.
  Acknowledge if no specific data is available for detailed analysis.
  ---
  `;

  if (instanceData && instanceData.nodes && instanceData.nodes.length > 0) {
    prompt += `
    Overview of Provided Proxmox Instance Data (if any):
    Total Nodes: ${instanceData.nodes.length}
    Total VMs: ${instanceData.vms?.length || 0}
    Total LXCs: ${instanceData.lxcs?.length || 0}
    `;

    instanceData.nodes.forEach(node => {
        prompt += `
        Node: ${node.name} (Status: ${node.status || 'N/A'})
          CPU Avg: ${node.cpu?.averageLoad || 'N/A'}%
          Memory Used: ${node.memory?.percentage || 'N/A'}%
          PVE Version: ${node.pveVersion || 'N/A'}, Updates Available: ${node.updatesAvailable ?? 'N/A'}`;
    });
  } else {
    prompt += "No specific Proxmox instance data is available for this report. The summary will be based on general knowledge.\n";
  }
  
  if (alerts && alerts.length > 0) {
    prompt += "\n\nActive Alerts Overview (if any):";
    alerts.forEach(alert => {
      prompt += `\n  - ${alert.severity}: ${alert.message}`;
    });
  } else if (instanceData) { // Only add "Active Alerts: None" if we had instanceData to check against
    prompt += "\n\nActive Alerts: None reported in provided data.";
  }

  prompt += "\n\nProvide a brief overall health assessment and 1-3 key recommendations. If system appears healthy or no data is present, state that and offer general Proxmox best practices.";

  try {
    const response: GenerateContentResponse = await genAI.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt
    });
    return response.text;
  } catch (error: any) {
    console.error("Error generating report summary with Gemini:", error);
     if (error.message && error.message.includes('API_KEY_INVALID')) { 
         return "Error: The Gemini API key is invalid. Cannot generate AI summary.";
    }
    return "Error generating AI summary for the report.";
  }
};

export const resetChat = (): void => {
  currentChat = null;
};
