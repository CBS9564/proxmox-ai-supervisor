
import React, { useState, useEffect, useRef } from 'react';
// import { ChatMessage, InstanceData, Alert } from '../types'; // Types for props and state
import { startOrContinueChat, resetChat as resetGeminiChat } from '../services/geminiService';
import { PaperAirplaneIcon, UserCircleIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { MAX_CHAT_HISTORY, MOCK_API_KEY_PLACEHOLDER } from '../constants';

// Removed GeminiProxmoxAssistantProps interface

const GeminiProxmoxAssistant = ({ instanceData, alerts, apiKeySet }) => { // Removed React.FC and props type
  const [chatMessages, setChatMessages] = useState([]); // Removed ChatMessage[] type argument
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null); // Removed HTMLDivElement type argument

  const systemInstruction = `You are a helpful Proxmox VE monitoring and troubleshooting assistant.
  Your goal is to analyze the provided Proxmox data (if any) and user queries to give concise, actionable advice.
  If data is provided, refer to it in your analysis.
  If no specific data is provided for a query, answer generally about Proxmox VE.
  Keep responses clear and focused. Do not provide opinions or information outside the scope of Proxmox VE management and troubleshooting.
  If asked for recommendations, base them on the data or common Proxmox best practices.
  Format your responses for readability, using markdown if helpful (e.g., bullet points).`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  useEffect(() => {
    // Reset chat if instanceData changes (meaning user switched instance)
    setChatMessages([]);
    resetGeminiChat();
  }, [instanceData]);


  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    if (!apiKeySet) {
        setChatMessages(prev => [...prev, 
            { id: Date.now().toString(), sender: 'system', text: "Gemini API key not configured. Please set it in Settings.", timestamp: new Date().toISOString() }
        ]);
        setUserInput('');
        return;
    }

    const newUserMessage = { // Removed ChatMessage type annotation
      id: Date.now().toString(),
      sender: 'user',
      text: userInput,
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages(prev => [...prev, newUserMessage].slice(-MAX_CHAT_HISTORY));
    setUserInput('');
    setIsLoading(true);

    // Add a temporary loading message for AI response
     const aiLoadingMessageId = (Date.now() + 1).toString();
     setChatMessages(prev => [...prev, { id: aiLoadingMessageId, sender: 'ai', text: "Thinking...", timestamp: new Date().toISOString(), isLoading: true}]);

    try {
      const aiResponseText = await startOrContinueChat(userInput, chatMessages, systemInstruction, instanceData, alerts);
      const newAiMessage = { // Removed ChatMessage type annotation
        id: Date.now().toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toISOString(),
      };
      // Replace loading message with actual response
      setChatMessages(prev => prev.map(msg => msg.id === aiLoadingMessageId ? newAiMessage : msg).slice(-MAX_CHAT_HISTORY));

    } catch (error) {
      console.error('Error with Gemini Assistant:', error);
      const errorMessage = { // Removed ChatMessage type annotation
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
     setChatMessages(prev => [...prev, 
        { id: Date.now().toString(), sender: 'system', text: "Chat history cleared.", timestamp: new Date().toISOString() }
    ]);
  }

  if (!apiKeySet && process.env.API_KEY === MOCK_API_KEY_PLACEHOLDER) {
     return (
        <div className="p-6 bg-gray-800 shadow-xl rounded-lg text-center">
            <SparklesIcon className="w-12 h-12 text-sky-500 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-200 mb-2">AI Assistant Disabled</h3>
            <p className="text-gray-400">
                The Gemini API key is not configured. Please set the <code>API_KEY</code> environment variable or add it in the Settings tab to enable the AI Assistant.
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
                'bg-yellow-600 text-white text-sm italic' /* system messages */
            }`}>
              {msg.sender === 'ai' && <SparklesIcon className="w-4 h-4 inline mr-1 mb-0.5 text-yellow-400" />}
              {msg.sender === 'user' && <UserCircleIcon className="w-4 h-4 inline mr-1 mb-0.5" />}
              {msg.isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {msg.text}
                </div>
              ) : (
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></div>
              )}
               <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-sky-200 text-right' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder={isLoading ? "AI is responding..." : "Ask about your Proxmox setup..."}
            className="flex-grow bg-gray-700 border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-100 placeholder-gray-400"
            disabled={isLoading || !apiKeySet}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim() || !apiKeySet}
            className="p-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiProxmoxAssistant;