
import React, { useState } from 'react';
import { KeyIcon, ServerStackIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MOCK_API_KEY_PLACEHOLDER } from '../constants';

const SetupGuide = ({
  onSaveApiKey,
  onSaveInstance,
  onDismiss,
  currentApiKey
}) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState(currentApiKey === MOCK_API_KEY_PLACEHOLDER ? '' : currentApiKey);
  const [showRealApiKey, setShowRealApiKey] = useState(false);

  const [instanceName, setInstanceName] = useState('');
  const [instanceApiUrl, setInstanceApiUrl] = useState('');
  const [instanceApiToken, setInstanceApiToken] = useState('');

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      onSaveApiKey(apiKey);
    }
    setStep(2); // Move to next step even if API key is not entered (user might set it later)
  };

  const handleSaveInstanceAndFinish = () => {
    if (!instanceName.trim() || !instanceApiUrl.trim() || !instanceApiToken.trim()) {
      alert('Please fill in all fields for the Proxmox instance.');
      return;
    }
    const newInstance = {
      id: Date.now().toString(),
      name: instanceName,
      apiUrl: instanceApiUrl,
      apiToken: instanceApiToken,
    };
    onSaveInstance(newInstance);
    onDismiss(); // This will also set the 'setupGuideCompleted' flag in App.tsx
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative ring-1 ring-sky-700">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-sky-400 transition-colors"
          aria-label="Close setup guide"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        <h2 className="text-3xl font-bold text-sky-400 mb-6 text-center">Welcome to Proxmox AI Supervisor!</h2>
        
        <div className="mb-4 p-3 bg-sky-800 bg-opacity-50 rounded-md border border-sky-700">
            <InformationCircleIcon className="w-6 h-6 inline mr-2 text-sky-300" />
            <span className="text-sm text-sky-300">This is a frontend-only demonstration. API keys and instance tokens are stored in your browser's local storage and are not sent to any external server by this application itself (except the Gemini API key to Google's servers). For real-time Proxmox data, a backend component is required.</span>
        </div>


        {/* Step 1: API Key */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
                <div className="inline-block p-3 bg-sky-700 rounded-full mb-3">
                    <KeyIcon className="w-8 h-8 text-sky-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-1">Step 1: Configure Gemini API Key</h3>
                <p className="text-sm text-gray-400">
                To use the AI Assistant and AI-powered reporting features, you need a Google Gemini API Key.
                You can obtain one from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Google AI Studio</a>.
                </p>
            </div>
            
            <div>
              <label htmlFor="setupApiKey" className="block text-sm font-medium text-gray-300 mb-1">Your Gemini API Key</label>
              <div className="flex items-center space-x-2">
                <input
                    type={showRealApiKey ? "text" : "password"}
                    id="setupApiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="flex-grow mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
                />
                <button 
                    type="button"
                    onClick={() => setShowRealApiKey(!showRealApiKey)} 
                    className="p-2.5 mt-1 text-xs bg-gray-600 hover:bg-gray-500 rounded-md text-gray-300"
                >
                    {showRealApiKey ? "Hide" : "Show"}
                </button>
              </div>
               <p className="text-xs text-gray-500 mt-1">You can skip this and add it later in Settings if you prefer.</p>
            </div>
            
            <button
              onClick={handleSaveApiKey}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 flex items-center justify-center"
            >
              Next: Configure Proxmox Instance <span className="ml-2">&rarr;</span>
            </button>
          </div>
        )}

        {/* Step 2: Proxmox Instance */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
                <div className="inline-block p-3 bg-sky-700 rounded-full mb-3">
                    <ServerStackIcon className="w-8 h-8 text-sky-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-1">Step 2: Add Your First Proxmox Instance</h3>
                <p className="text-sm text-gray-400">
                Provide connection details for your Proxmox VE server.
                </p>
            </div>

            <div>
              <label htmlFor="setupInstanceName" className="block text-sm font-medium text-gray-300">Instance Name</label>
              <input
                type="text"
                id="setupInstanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="e.g., Home Lab PVE"
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="setupApiUrl" className="block text-sm font-medium text-gray-300">Proxmox API URL</label>
              <input
                type="text"
                id="setupApiUrl"
                value={instanceApiUrl}
                onChange={(e) => setInstanceApiUrl(e.target.value)}
                placeholder="https://your-proxmox-ip-or-domain:8006"
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">This is the URL you use to access the Proxmox web UI, including the port (usually 8006).</p>
            </div>
            <div>
              <label htmlFor="setupApiToken" className="block text-sm font-medium text-gray-300">Proxmox API Token</label>
              <input
                type="password"
                id="setupApiToken"
                value={instanceApiToken}
                onChange={(e) => setInstanceApiToken(e.target.value)}
                placeholder="user@realm!tokenid=secret-uuid"
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Create an API Token in Proxmox VE under Datacenter &rarr; Permissions &rarr; API Tokens. Ensure it has appropriate permissions (e.g., PVEAuditor role for read-only access).</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                onClick={() => setStep(1)}
                className="w-full sm:w-auto py-2.5 px-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150"
                >
                &larr; Back to API Key
                </button>
                <button
                onClick={handleSaveInstanceAndFinish}
                className="w-full sm:flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150"
                >
                Save Instance & Get Started
                </button>
            </div>
          </div>
        )}
         <div className="mt-8 text-center">
            <button onClick={onDismiss} className="text-sm text-gray-500 hover:text-sky-400">
                {step === 1 && apiKey.trim() === '' ? "Skip setup and configure later" : "I'll configure everything later"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;
