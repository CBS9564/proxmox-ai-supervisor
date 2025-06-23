
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, InstanceData, Alert } from '../types';
import { startOrContinueChat, resetChat as resetGeminiChat } from '../services/geminiService';
import { PaperAirplaneIcon, UserCircleIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { MAX_CHAT_HISTORY, MOCK_API_KEY_PLACEHOLDER } from '../constants';

interface GeminiProxmoxAssistantProps {
  instanceData: InstanceData | null; // Will be null
  alerts: Alert[]; // Will be empty
  apiKeySet: boolean;
}

const GeminiProxmoxAssistant: React.FC<GeminiProxmoxAssistantProps> = ({ instanceData, alerts, apiKeySet }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const systemInstruction = `You are a helpful Proxmox VE monitoring and troubleshooting assistant.
  Your goal is to analyze user queries to give concise, actionable advice regarding Proxmox VE.
  No specific live instance data is available to you unless explicitly provided by the user in their query.
  Answer generally about Proxmox VE best practices, configuration, and troubleshooting.
  Keep responses clear and focused. Do not provide opinions or information outside the scope of Proxmox VE management.
  Format your responses for readability, using markdown if helpful (e.g., bullet points).`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  useEffect(() => {
    // Reset chat if the instance context conceptually changes,
    // though instanceData itself will remain null.
    // This effectively resets if the selected instance ID changes via App.tsx logic.
    setChatMessages([]);
    resetGeminiChat();
    const initMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        text: "Chat context initialized. Ask me about Proxmox VE!",
        timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, initMessage]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceData]); // instanceData reference itself might change if selectedInstanceId changes.


  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    if (!apiKeySet) {
        const apiKeyMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'system',
            text: "Gemini API key not configured. Please set it via the API_KEY environment variable.",
            timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, apiKeyMessage].slice(-MAX_CHAT_HISTORY));
        setUserInput('');
        return;
    }

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userInput,
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages(prev => [...prev, newUserMessage].slice(-MAX_CHAT_HISTORY));
    setUserInput('');
    setIsLoading(true);

     const aiLoadingMessageId = (Date.now() + 1).toString();
     const loadingMessage: ChatMessage = {
        id: aiLoadingMessageId,
        sender: 'ai',
        text: "Thinking...",
        timestamp: new Date().toISOString(),
        isLoading: true
     };
     setChatMessages(prev => [...prev, loadingMessage].slice(-MAX_CHAT_HISTORY));

    try {
      // Pass null for instanceData and empty alerts, as they are not available from mock/real backend
      const aiResponseText = await startOrContinueChat(userInput, chatMessages, systemInstruction, null, []);
      const newAiMessage: ChatMessage = {
        id: Date.now().toString(), 
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => prev.map(msg => msg.id === aiLoadingMessageId ? newAiMessage : msg).slice(-MAX_CHAT_HISTORY));

    } catch (error) {
      console.error('Error with Gemini Assistant:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(), 
        sender: 'system',
        text: 'Error communicating with AI. Check console for details.',
        timestamp: new Date().toISOString(),
      };
       setChatMessages(prev => prev.map(msg => msg.id === aiLoadingMessageId ? errorMessage : msg).slice(-MAX_CHAT_HISTORY));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetChat = () => {
    setChatMessages([]);
    resetGeminiChat();
    const resetMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        text: "Chat history cleared.",
        timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, resetMessage]);
  }

  // This check relies on process.env.API_KEY directly as per guidelines.
  // The apiKeySet prop reflects this state from App.tsx.
  if (!apiKeySet) {
     return (
        <div className="p-6 bg-gray-800 shadow-xl rounded-lg text-center">
            <SparklesIcon className="w-12 h-12 text-sky-500 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-200 mb-2">AI Assistant Disabled</h3>
            <p className="text-gray-400">
                The Gemini API key is not configured. Please ensure the <code>API_KEY</code> environment variable is set to enable the AI Assistant.
            </p>
        </div>
     );
  }


  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px] bg-gray-800 shadow-2xl rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-sky-400 flex items-center">
          <SparklesIcon className="w-6 h-6 mr-2 text-yellow-400" />
          Proxmox AI Assistant
        </h3>
        <button
            onClick={handleResetChat}
            className="p-1.5 text-gray-400 hover:text-sky-400 rounded-full hover:bg-gray-700 transition-colors"
            title="Clear Chat History"
        >
            <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-3 rounded-xl shadow ${
                msg.sender === 'user' ? 'bg-sky-600 text-white' : 
                msg.sender === 'ai' ? 'bg-gray-700 text-gray-200' : 
                'bg-yellow-600 text-white text-sm italic' 
            }`}>
              {msg.sender === 'ai' && <SparklesIcon className="w-4 h-4 inline mr-1 mb-0.5 text-yellow-400" />}
              {msg.sender === 'user' && <UserCircleIcon className="w-4 h-4 inline mr-1 mb-0.5" />}
              {msg.isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 01