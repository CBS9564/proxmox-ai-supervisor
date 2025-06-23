
import { GoogleGenAI } from "@google/genai"; // Removed GenerateContentResponse, GenerateContentParameters, Chat as they are mainly for typing
import { GEMINI_TEXT_MODEL } from '../constants';
// Removed ChatMessage, InstanceData, Alert from import as they are types from types.ts

let ai = null; // Removed : GoogleGenAI | null
let currentChat = null; // Removed : Chat | null

const initializeGemini = () => { // Removed (): GoogleGenAI return type
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set for Gemini.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const startOrContinueChat = async (
  userMessage, // Removed : string
  history, // Removed : ChatMessage[]
  systemInstruction, // Removed ?: string
  instanceData, // Removed ?: InstanceData | null
  alerts // Removed ?: Alert[]
) => { // Removed : Promise<string> return type
  const genAI = initializeGemini();

  let promptContent = "";
  if (instanceData) {
    promptContent += "Current Proxmox Instance Data Snapshot:\n";
    instanceData.nodes.forEach(node => {
      promptContent += `Node ${node.name}: CPU ${node.cpu.averageLoad}%, Mem ${node.memory.percentage}%, PVE Ver ${node.pveVersion}\n`;
      node.storagePools.forEach(sp => {
        promptContent += `  Storage ${sp.name}: ${sp.metric.percentage}% used (${sp.metric.used}${sp.metric.unit}/${sp.metric.total}${sp.metric.unit})\n`;
      });
    });
    instanceData.vms.forEach(vm => {
      promptContent += `VM ${vm.name} (on ${vm.nodeId}): CPU ${vm.cpuUsage}%, Mem ${vm.memory.percentage}%\n`;
    });
     instanceData.lxcs.forEach(lxc => {
      promptContent += `LXC ${lxc.name} (on ${lxc.nodeId}): CPU ${lxc.cpuUsage}%, Mem ${lxc.memory.percentage}%\n`;
    });
    promptContent += "\n";
  }

  if (alerts && alerts.length > 0) {
    promptContent += "Active Alerts:\n";
    alerts.forEach(alert => {
      promptContent += `- ${alert.severity}: ${alert.message}\n`;
    });
    promptContent += "\n";
  }
  
  promptContent += `User query: ${userMessage}`;

  if (!currentChat) {
    const modelOperationConfig: { 
      systemInstruction?: string; 
      thinkingConfig?: { thinkingBudget: number; } 
    } = {}; // This will hold systemInstruction, etc.
    if (systemInstruction) {
      modelOperationConfig.systemInstruction = systemInstruction;
    }
    // Add other potential model configurations to modelOperationConfig here if needed.
    // For example, if thinkingConfig is desired for GEMINI_TEXT_MODEL:
    // if (GEMINI_TEXT_MODEL === "gemini-2.5-flash-preview-04-17") {
    //   // modelOperationConfig.thinkingConfig = { thinkingBudget: 0 }; // Example to disable thinking
    // }

    currentChat = genAI.chats.create({
      model: GEMINI_TEXT_MODEL,
      // Pass the config object only if it has properties, otherwise it will be undefined.
      // The SDK handles config: undefined correctly.
      config: Object.keys(modelOperationConfig).length > 0 ? modelOperationConfig : undefined
    });
  }
  
  // const geminiHistory = history.map(msg => ({ // This was illustrative, not strictly needed with currentChat.sendMessage
  //   role: msg.sender === 'user' ? 'user' : 'model',
  //   parts: [{text: msg.text}]
  // }));

  try {
    // The 'Chat' object from SDK should handle history.
    const response = await currentChat.sendMessage({ message: promptContent }); // Removed : GenerateContentResponse type
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API_KEY_INVALID')) { // Check if error has message property
         return "Error: The Gemini API key is invalid or not configured correctly. Please check your API_KEY environment variable.";
    }
    return "Sorry, I encountered an error trying to process your request. Please check the console for details.";
  }
};

export const generateProxmoxReportSummary = async (
  instanceData, // Removed : InstanceData
  alerts // Removed : Alert[]
) => { // Removed : Promise<string> return type
  const genAI = initializeGemini();
  let prompt = `You are a Proxmox VE monitoring assistant. Generate a concise summary and potential recommendations based on the following data.
  Focus on critical issues and actionable advice. Be brief.

  Current Proxmox Instance Data:
  Total Nodes: ${instanceData.nodes.length}
  Total VMs: ${instanceData.vms.length}
  Total LXCs: ${instanceData.lxcs.length}
  `;

  instanceData.nodes.forEach(node => {
    prompt += `
    Node: ${node.name} (Status: ${node.status})
      CPU: ${node.cpu.averageLoad}% avg, ${node.cpu.cores} cores
      Memory: ${node.memory.percentage}% used (${node.memory.used}${node.memory.unit} / ${node.memory.total}${node.memory.unit})
      PVE Version: ${node.pveVersion}, Updates Available: ${node.updatesAvailable ?? 'N/A'}
      Storage:`;
    node.storagePools.forEach(sp => {
      prompt += `\n        - ${sp.name} (${sp.type}): ${sp.metric.percentage}% used (${sp.metric.used}${sp.metric.unit} of ${sp.metric.total}${sp.metric.unit})`;
    });
  });

  if (instanceData.vms.length > 0) {
    prompt += "\n\nKey VMs with high resource usage (if any):";
    instanceData.vms.filter(vm => vm.cpuUsage > 75 || (vm.memory.percentage && vm.memory.percentage > 75)).slice(0,3).forEach(vm => {
        prompt += `\n  - VM ${vm.name} (on ${vm.nodeId}): CPU ${vm.cpuUsage}%, Memory ${vm.memory.percentage}%`;
    });
  }
  
  if (alerts.length > 0) {
    prompt += "\n\nActive Alerts:";
    alerts.forEach(alert => {
      prompt += `\n  - ${alert.severity}: ${alert.message} (Resource: ${alert.resourceId || 'System'})`;
    });
  } else {
    prompt += "\n\nActive Alerts: None";
  }

  prompt += "\n\nProvide a brief overall health assessment and 1-3 key recommendations if issues are present. If system is healthy, state that.";

  try {
    const response = await genAI.models.generateContent({ // Removed : GenerateContentResponse type
        model: GEMINI_TEXT_MODEL,
        contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error generating report summary with Gemini:", error);
     if (error instanceof Error && error.message.includes('API_KEY_INVALID')) { // Check if error has message property
         return "Error: The Gemini API key is invalid. Cannot generate AI summary.";
    }
    return "Error generating AI summary for the report.";
  }
};

// Function to reset chat history (e.g., when switching instances or topics)
export const resetChat = () => {
  currentChat = null;
};
