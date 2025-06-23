
import React, { useState } from 'react';
// Removed ProxmoxInstanceConfig import as it's a type
import { PlusCircleIcon, TrashIcon, ServerStackIcon, WifiIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Removed InstanceConfiguratorProps interface
// Removed TestStatus type alias
// Removed TestResult interface

const InstanceConfigurator = ({
  instances,
  onAddInstance,
  onRemoveInstance,
  onSelectInstance,
  selectedInstanceId,
}) => {
  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [testResults, setTestResults] = useState({}); // Simplified state type

  const handleSubmit = (e) => { // Removed e: React.FormEvent type
    e.preventDefault();
    if (!name.trim() || !apiUrl.trim() || !apiToken.trim()) {
      alert('Please fill in all fields for the Proxmox instance.');
      return;
    }
    const newInstanceId = Date.now().toString();
    onAddInstance({
      id: newInstanceId,
      name,
      apiUrl,
      apiToken,
    });
    setName('');
    setApiUrl('');
    setApiToken('');
    setShowForm(false);
    setTestResults(prev => ({ ...prev, [newInstanceId]: { status: 'idle' } }));
  };

  const handleTestConnection = async (instance) => { // Removed instance: ProxmoxInstanceConfig type
    setTestResults(prev => ({ ...prev, [instance.id]: { status: 'testing', message: 'Testing...' } }));

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay

    const urlIsValid = instance.apiUrl.startsWith('https://') && instance.apiUrl.includes(':8006');
    
    const atIndex = instance.apiToken.indexOf('@');
    const exclamationIndex = instance.apiToken.indexOf('!');
    const equalsIndex = instance.apiToken.indexOf('=');

    const tokenIsValid = 
      atIndex > 0 && 
      exclamationIndex > atIndex + 1 && 
      equalsIndex > exclamationIndex + 1 && 
      equalsIndex < instance.apiToken.length - 5 && 
      instance.apiToken.length > 20;

    if (urlIsValid && tokenIsValid) {
      setTestResults(prev => ({
        ...prev,
        [instance.id]: { status: 'success', message: 'Connection successful (mock)' },
      }));
    } else {
      let errorMessage = 'Connection failed (mock):';
      if (!urlIsValid) errorMessage += ' Invalid API URL format (expected https://...:8006).';
      if (!tokenIsValid) errorMessage += ' Invalid API Token format (expected user@realm!tokenid=secret_value).';
      setTestResults(prev => ({
        ...prev,
        [instance.id]: { status: 'error', message: errorMessage.trim() },
      }));
    }
  };


  const getStatusIcon = (status) => { // Removed status: TestStatus type
    switch (status) {
      case 'testing':
        return <ArrowPathIcon className="w-4 h-4 text-sky-400 animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-800 shadow-xl rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
          <ServerStackIcon className="w-8 h-8 mr-2" />
          Proxmox Instances
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full transition-colors duration-150"
          aria-label={showForm ? "Cancel adding instance" : "Add new instance"}
        >
          <PlusCircleIcon className={`w-6 h-6 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-700 rounded-md">
          <div>
            <label htmlFor="instanceName" className="block text-sm font-medium text-gray-300">Instance Name</label>
            <input
              type="text"
              id="instanceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Home Lab PVE"
              className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-300">API URL</label>
            <input
              type="text"
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="e.g., https://proxmox.example.com:8006"
              className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="apiToken" className="block text-sm font-medium text-gray-300">API Token (mock)</label>
            <input
              type="password"
              id="apiToken"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="user@realm!tokenid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
          >
            Add Instance
          </button>
        </form>
      )}

      {instances.length === 0 && !showForm && (
        <p className="text-gray-400 text-center py-4">No Proxmox instances configured. Click the '+' button to add one.</p>
      )}

      {instances.length > 0 && (
        <div className="space-y-3">
          {instances.map(instance => {
            const testResult = testResults[instance.id] || { status: 'idle' };
            return (
              <div
                key={instance.id}
                className={`p-4 rounded-md transition-all duration-200 
                            ${selectedInstanceId === instance.id ? 'bg-sky-700 ring-2 ring-sky-400' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => onSelectInstance(instance.id)}
                >
                    <div>
                        <h3 className="text-lg font-medium text-white">{instance.name}</h3>
                        <p className="text-sm text-gray-400 break-all">{instance.apiUrl}</p>
                    </div>
                     <button
                        onClick={(e) => { e.stopPropagation(); onRemoveInstance(instance.id); }}
                        className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-700 rounded-full transition-colors self-start"
                        aria-label={`Remove instance ${instance.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-600 flex justify-between items-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleTestConnection(instance); }}
                        disabled={testResult.status === 'testing'}
                        className="flex items-center text-xs px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label={`Test connection for ${instance.name}`}
                    >
                        <WifiIcon className="w-4 h-4 mr-1" />
                        Test
                    </button>
                    {testResult.status !== 'idle' && (
                    <div className="flex items-center ml-2 text-xs">
                        {getStatusIcon(testResult.status)}
                        <span className={`ml-1 ${
                            testResult.status === 'success' ? 'text-green-300' :
                            testResult.status === 'error' ? 'text-red-300' : 'text-sky-300'
                        }`}>
                        {testResult.message}
                        </span>
                    </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
       {instances.length > 0 && selectedInstanceId && (
         <button
            onClick={() => onSelectInstance(null)}
            className="mt-4 w-full text-sm text-sky-400 hover:text-sky-300"
          >
            Deselect Instance
          </button>
        )}
    </div>
  );
};

export default InstanceConfigurator;
