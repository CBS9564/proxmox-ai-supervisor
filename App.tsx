
import React, { useState, useEffect, useCallback } from 'react';
import { ProxmoxInstanceConfig, InstanceData, Alert, UserSettings, Status, TabOption, StatusType } from './types';
// Removed: import { fetchMockInstanceData } from './services/mockProxmoxService';
import { APP_TITLE, DEFAULT_USER_SETTINGS, NAV_TABS, MOCK_API_KEY_PLACEHOLDER } from './constants'; // Removed MOCK_DATA_REFRESH_INTERVAL_MS
import InstanceConfigurator from './components/InstanceConfigurator';
import InstanceDashboard from './components/InstanceDashboard';
import GeminiProxmoxAssistant from './components/GeminiProxmoxAssistant';
import SettingsManager from './components/SettingsManager';
import ReportViewer from './components/ReportViewer';
import SetupGuide, { SetupGuideProps } from './components/SetupGuide';
import { resetChat as resetGeminiChatInternal } from './services/geminiService';
import { ShieldExclamationIcon, SunIcon } from '@heroicons/react/24/solid';

interface AppError {
  type: "CONFIG_ERROR" | "REAL_DATA_INFO" | "CONFIG_INCOMPLETE" | "FETCH_ERROR" | "INFO";
  message: string;
}

if (typeof process.env.API_KEY === 'undefined') {
  process.env.API_KEY = MOCK_API_KEY_PLACEHOLDER;
}

const App: React.FC = () => {
  const [configuredInstances, setConfiguredInstances] = useState<ProxmoxInstanceConfig[]>(() => {
    const saved = localStorage.getItem('proxmoxInstances');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [currentInstanceData, setCurrentInstanceData] = useState<InstanceData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);
  const [activeTab, setActiveTab] = useState<string>(NAV_TABS[0].id);
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('userSettings');
    return saved ? JSON.parse(saved) : DEFAULT_USER_SETTINGS;
  });

  const isApiKeyEffectivelySet = process.env.API_KEY !== undefined && process.env.API_KEY !== MOCK_API_KEY_PLACEHOLDER && process.env.API_KEY !== "YOUR_GEMINI_API_KEY";

  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(() => {
    const guideCompleted = localStorage.getItem('setupGuideCompleted');
    if (guideCompleted === 'true') {
      return false;
    }
    const instancesExist = (localStorage.getItem('proxmoxInstances') ? JSON.parse(localStorage.getItem('proxmoxInstances') || '[]') : []).length > 0;
    return !instancesExist || !isApiKeyEffectivelySet;
  });

  useEffect(() => {
    localStorage.setItem('proxmoxInstances', JSON.stringify(configuredInstances));
  }, [configuredInstances]);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
  }, [userSettings]);

  const loadInstanceData = useCallback(async (instanceId: string | null) => {
    setCurrentInstanceData(null); // Always start with null data
    setAlerts([]);
    setError(null);
    setIsLoading(false); // No actual loading will occur in frontend-only

    if (!instanceId) {
      return;
    }

    const instanceConfig = configuredInstances.find(inst => inst.id === instanceId);
    if (!instanceConfig) {
      setError({type: "CONFIG_ERROR", message: "Selected instance configuration not found."});
      return;
    }

    if (!instanceConfig.apiUrl || !instanceConfig.apiUrl.trim() || !instanceConfig.apiToken || !instanceConfig.apiToken.trim()) {
      setError({
        type: "CONFIG_INCOMPLETE",
        message: `Configuration for instance "${instanceConfig.name}" is incomplete. API URL and/or Token are missing. Please complete the configuration in the 'Instances' tab.`
      });
    } else {
      // This is now the primary path for configured instances.
      // It informs the user that a backend is needed for actual data.
      setError({
        type: "REAL_DATA_INFO",
        message: `Real-time data from Proxmox instance "${instanceConfig.name}" (${instanceConfig.apiUrl}) cannot be displayed. This frontend-only application requires a backend/proxy component to securely connect to your Proxmox API due to browser CORS policy. Please refer to the documentation for setting up a backend.`
      });
    }
  }, [configuredInstances]);

  useEffect(() => {
    if (selectedInstanceId) {
      loadInstanceData(selectedInstanceId);
      // No automatic refresh interval as data is not live.
    } else {
      setCurrentInstanceData(null);
      setAlerts([]);
      setError(null);
    }
  }, [selectedInstanceId, loadInstanceData]);


  // Alert generation from mock data is removed.
  // Real alerts would come from a backend.
  useEffect(() => {
    setAlerts([]); // Clear alerts when instance data context changes or is null
  }, [currentInstanceData]);

  const handleAddInstance = (instance: ProxmoxInstanceConfig) => {
    setConfiguredInstances(prev => [...prev, instance]);
    setSelectedInstanceId(instance.id); 
    setError(null); 
    resetGeminiChatInternal();
  };

  const handleRemoveInstance = (instanceId: string) => {
    setConfiguredInstances(prev => prev.filter(inst => inst.id !== instanceId));
    if (selectedInstanceId === instanceId) {
      setSelectedInstanceId(null);
      setCurrentInstanceData(null);
      setAlerts([]);
      setError(null);
      resetGeminiChatInternal();
    }
  };
  
  const handleSelectInstance = (instanceId: string | null) => {
    if(instanceId !== selectedInstanceId) {
        resetGeminiChatInternal(); 
        setError(null); 
        setCurrentInstanceData(null); 
        setAlerts([]);
    }
    setSelectedInstanceId(instanceId);
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
  };
  
  const handleSetupGuideDismiss = () => {
    localStorage.setItem('setupGuideCompleted', 'true');
    setShowSetupGuide(false);
  };

  const handleSaveInstanceFromGuide: SetupGuideProps['onSaveInstance'] = (instance) => {
     handleAddInstance(instance); 
  };


  const renderActiveTab = () => {
    let specificMessageForView: string | null = null;
    if (error && (error.type === "REAL_DATA_INFO" || error.type === "CONFIG_INCOMPLETE" || error.type === "CONFIG_ERROR")) {
        specificMessageForView = error.message;
    }
    // If an instance is selected but currentInstanceData is null (which it always will be without a backend)
    // and there's no specific error message yet (e.g. REAL_DATA_INFO), set a generic one for dashboard/reports.
    if (selectedInstanceId && !currentInstanceData && !specificMessageForView && (activeTab === 'dashboard' || activeTab === 'reports')) {
        const selectedConf = configuredInstances.find(i => i.id === selectedInstanceId);
        if (selectedConf?.apiUrl && selectedConf?.apiToken) {
             specificMessageForView = `Data for "${selectedConf.name}" cannot be displayed. A backend is required to fetch live data from your Proxmox server.`;
        } else if (selectedConf) {
            specificMessageForView = `Configuration for "${selectedConf.name}" is incomplete. Please check API URL and Token in the 'Instances' tab.`;
        }
    }


    switch (activeTab) {
      case 'dashboard':
        return <InstanceDashboard instanceData={null} alerts={alerts} isLoading={isLoading} specificMessage={specificMessageForView} />;
      case 'instances':
        return <InstanceConfigurator instances={configuredInstances} onAddInstance={handleAddInstance} onRemoveInstance={handleRemoveInstance} onSelectInstance={handleSelectInstance} selectedInstanceId={selectedInstanceId} />;
      case 'reports':
        return <ReportViewer instanceData={null} alerts={alerts} settings={userSettings} apiKeySet={isApiKeyEffectivelySet} specificMessage={specificMessageForView} />;
      case 'assistant':
        // Assistant might not need specificMessage, it operates more generally or with explicit user queries
        return <GeminiProxmoxAssistant instanceData={null} alerts={alerts} apiKeySet={isApiKeyEffectivelySet} />;
      case 'settings':
        return <SettingsManager userSettings={userSettings} onUpdateSettings={handleUpdateSettings} isApiKeyConfigured={isApiKeyEffectivelySet} />;
      default:
        return <InstanceDashboard instanceData={null} alerts={alerts} isLoading={isLoading} specificMessage={specificMessageForView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {showSetupGuide && (
        <SetupGuide
          onSaveInstance={handleSaveInstanceFromGuide}
          onDismiss={handleSetupGuideDismiss}
          isApiKeyPreConfigured={isApiKeyEffectivelySet}
        />
      )}
      <header className="bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sky-400 flex items-center">
            <SunIcon className="w-8 h-8 mr-2 text-yellow-400" /> 
            {APP_TITLE}
          </h1>
          <nav className="flex space-x-1 sm:space-x-2">
            {NAV_TABS.map((tab: TabOption) => ( 
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-2 sm:px-3 sm:py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-150
                  ${activeTab === tab.id ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        {!isApiKeyEffectivelySet && (
             <div className="bg-yellow-600 text-white text-xs text-center py-1 px-4">
                <ShieldExclamationIcon className="w-4 h-4 inline mr-1" />
                Gemini API Key not configured. AI features may be limited or disabled. Please set the API_KEY environment variable.
            </div>
        )}
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6">
        {error && error.type === "FETCH_ERROR" && <div className="bg-red-700 text-white p-3 rounded-md mb-4 shadow-lg">{error.message}</div>}
        {renderActiveTab()}
      </main>

      <footer className="bg-gray-800 text-center p-4 text-xs text-gray-500 border-t border-gray-700">
        &copy; {new Date().getFullYear()} {APP_TITLE}. For real-time Proxmox data visualization, a backend component is required.
      </footer>
    </div>
  );
};

export default App;
