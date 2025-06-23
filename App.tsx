
import React, { useState, useEffect, useCallback } from 'react';
// Types are used for annotations, browser will ignore them if types.ts isn't JS-parseable
// For a non-transpiled environment, these type imports would ideally be removed or handled differently.
import { ProxmoxInstanceConfig, InstanceData, Alert, UserSettings, Status, TabOption } from './types';
import { fetchMockInstanceData } from './services/mockProxmoxService';
import { APP_TITLE, DEFAULT_USER_SETTINGS, MOCK_DATA_REFRESH_INTERVAL_MS, NAV_TABS, MOCK_API_KEY_PLACEHOLDER } from './constants';
// Ensured all local component imports are relative
import InstanceConfigurator from './components/InstanceConfigurator';
import InstanceDashboard from './components/InstanceDashboard';
import GeminiProxmoxAssistant from './components/GeminiProxmoxAssistant';
import SettingsManager from './components/SettingsManager';
import ReportViewer from './components/ReportViewer';
import SetupGuide from './components/SetupGuide'; // Added SetupGuide import
import { resetChat as resetGeminiChatInternal } from './services/geminiService';
import { ShieldExclamationIcon, SunIcon } from '@heroicons/react/24/solid';


const getInitialApiKey = (): string => {
    const envApiKey = process.env.API_KEY;
    // Fallback to localStorage if process.env.API_KEY is the placeholder, then to the placeholder itself
    if (envApiKey && envApiKey !== MOCK_API_KEY_PLACEHOLDER) {
        return envApiKey;
    }
    const savedKey = localStorage.getItem('geminiApiKey');
    return savedKey || MOCK_API_KEY_PLACEHOLDER;
};

// Ensure process.env.API_KEY is initialized for the Gemini service
if (!process.env.API_KEY || process.env.API_KEY === "YOUR_GEMINI_API_KEY") {
  const initialKey = getInitialApiKey();
  process.env.API_KEY = initialKey;
}


const App = () => { // Removed :React.FC type annotation
  const [configuredInstances, setConfiguredInstances] = useState(() => { // Removed type annotation
    const saved = localStorage.getItem('proxmoxInstances');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedInstanceId, setSelectedInstanceId] = useState(null); // Removed type annotation
  const [currentInstanceData, setCurrentInstanceData] = useState(null); // Removed type annotation
  const [alerts, setAlerts] = useState([]); // Removed type annotation
  const [isLoading, setIsLoading] = useState(false); // Removed type annotation
  const [error, setError] = useState(null); // Removed type annotation for error state
  const [activeTab, setActiveTab] = useState(NAV_TABS[0].id); // Removed type annotation
  const [userSettings, setUserSettings] = useState(() => { // Removed type annotation
    const saved = localStorage.getItem('userSettings');
    return saved ? JSON.parse(saved) : DEFAULT_USER_SETTINGS;
  });
   const [geminiApiKey, setGeminiApiKey] = useState(getInitialApiKey); // Use getter function directly

  const [showSetupGuide, setShowSetupGuide] = useState(() => {
    const guideCompleted = localStorage.getItem('setupGuideCompleted');
    if (guideCompleted === 'true') {
      return false;
    }
    const instancesExist = (localStorage.getItem('proxmoxInstances') ? JSON.parse(localStorage.getItem('proxmoxInstances') || '[]') : []).length > 0;
    const keyIsPlaceholder = getInitialApiKey() === MOCK_API_KEY_PLACEHOLDER;
    
    // Show if not completed AND (no instances OR key is placeholder)
    return !instancesExist || keyIsPlaceholder;
  });


  useEffect(() => {
    // Update process.env.API_KEY for Gemini service when geminiApiKey state changes
    if (geminiApiKey && geminiApiKey !== MOCK_API_KEY_PLACEHOLDER) {
        process.env.API_KEY = geminiApiKey;
    } else {
        // If it's placeholder, ensure process.env.API_KEY is also placeholder or default
        // This handles cases where user clears the key from settings.
        process.env.API_KEY = MOCK_API_KEY_PLACEHOLDER;
    }
  }, [geminiApiKey]);

  useEffect(() => {
    localStorage.setItem('proxmoxInstances', JSON.stringify(configuredInstances));
  }, [configuredInstances]);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    if (geminiApiKey && geminiApiKey !== MOCK_API_KEY_PLACEHOLDER) {
        localStorage.setItem('geminiApiKey', geminiApiKey);
    } else {
        localStorage.removeItem('geminiApiKey'); // Remove if it's the placeholder
    }
  }, [geminiApiKey]);

  const isApiKeyEffectivelySet = geminiApiKey !== MOCK_API_KEY_PLACEHOLDER;

  const loadInstanceData = useCallback(async (instanceId) => { // Removed type annotation for instanceId
    if (!instanceId) {
      setCurrentInstanceData(null);
      setAlerts([]);
      setError(null);
      return;
    }
    const instanceConfig = configuredInstances.find(inst => inst.id === instanceId);
    if (!instanceConfig) {
      setError({type: "CONFIG_ERROR", message: "Selected instance configuration not found."});
      setCurrentInstanceData(null);
      setAlerts([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentInstanceData(null); 
    setAlerts([]); 

    if (instanceConfig.apiUrl && instanceConfig.apiUrl.trim() !== '' && 
        instanceConfig.apiToken && instanceConfig.apiToken.trim() !== '') {
      
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      setError({
        type: "REAL_DATA_INFO",
        message: `Displaying real-time data from ${instanceConfig.name} (${instanceConfig.apiUrl}) requires a backend proxy. This is because web browsers restrict direct API calls to different servers for security (CORS policy). This frontend-only application cannot directly connect to your Proxmox API. To see live data, a backend service is needed to fetch data from Proxmox and relay it to this dashboard.`
      });
      setIsLoading(false);
    } else {
       try {
           if (!instanceConfig.apiUrl || !instanceConfig.apiToken) {
             setError({
                type: "CONFIG_INCOMPLETE",
                message: `Configuration for instance "${instanceConfig.name}" is incomplete. Please provide API URL and Token in the 'Instances' tab.`
             });
             setIsLoading(false);
             return;
           }
           setError({
             type: "INFO",
             message: "Instance selected, but it's not configured for a real connection attempt and mock data loading is disabled for user-configured instances to avoid 'fake data'."
           })
        } catch (err) {
            console.error("Error during data handling:", err);
            setError({type: "FETCH_ERROR", message: "Failed to process data for instance. See console for details."});
        } finally {
            setIsLoading(false);
        }
    }
  }, [configuredInstances]);

  useEffect(() => {
    if (selectedInstanceId) {
      if (!error || error.type !== "REAL_DATA_INFO") {
        loadInstanceData(selectedInstanceId); 

        const intervalId = setInterval(() => {
          if (selectedInstanceId && (!error || (error.type !== "REAL_DATA_INFO" && error.type !== "CONFIG_INCOMPLETE" && error.type !== "CONFIG_ERROR"))) {
              loadInstanceData(selectedInstanceId);
          }
        }, MOCK_DATA_REFRESH_INTERVAL_MS);
        return () => clearInterval(intervalId);
      } else {
        loadInstanceData(selectedInstanceId);
      }
    } else {
      setCurrentInstanceData(null);
      setAlerts([]);
      setError(null);
    }
  }, [selectedInstanceId, loadInstanceData, error]);


  useEffect(() => {
    if (!currentInstanceData) {
      setAlerts([]);
      return;
    }
    const newAlerts = []; 
    currentInstanceData.nodes.forEach(node => {
      if (node.cpu.averageLoad > userSettings.alertThresholds.cpuUsagePercent) {
        newAlerts.push({ id: `node-cpu-${node.id}`, severity: 'Critical', message: `Node ${node.name} CPU usage is ${node.cpu.averageLoad.toFixed(1)}% (Threshold: ${userSettings.alertThresholds.cpuUsagePercent}%)`, timestamp: new Date().toISOString(), resourceId: node.id, resourceType: 'Node' });
      }
      if (node.memory.percentage && node.memory.percentage > userSettings.alertThresholds.memoryUsagePercent) {
        newAlerts.push({ id: `node-mem-${node.id}`, severity: 'Warning', message: `Node ${node.name} memory usage is ${node.memory.percentage}% (Threshold: ${userSettings.alertThresholds.memoryUsagePercent}%)`, timestamp: new Date().toISOString(), resourceId: node.id, resourceType: 'Node' });
      }
      node.storagePools.forEach(pool => {
        if (pool.metric.percentage && pool.metric.percentage > userSettings.alertThresholds.diskUsagePercent) {
          newAlerts.push({ id: `node-disk-${node.id}-${pool.id}`, severity: 'Warning', message: `Node ${node.name} storage pool '${pool.name}' usage is ${pool.metric.percentage}% (Threshold: ${userSettings.alertThresholds.diskUsagePercent}%)`, timestamp: new Date().toISOString(), resourceId: `${node.id}-${pool.name}`, resourceType: 'Node' });
        }
        const freeGB = pool.metric.total - pool.metric.used;
        if (pool.metric.unit.toUpperCase() === 'GB' && freeGB < userSettings.alertThresholds.lowDiskFreeGb) {
             newAlerts.push({ id: `node-disk-low-${node.id}-${pool.id}`, severity: 'Critical', message: `Node ${node.name} storage pool '${pool.name}' has only ${freeGB.toFixed(1)}GB free (Threshold: <${userSettings.alertThresholds.lowDiskFreeGb}GB)`, timestamp: new Date().toISOString(), resourceId: `${node.id}-${pool.name}`, resourceType: 'Node' });
        }
      });
      node.services.forEach(service => {
        if (service.status === Status.Error || service.status === Status.Critical) { 
            newAlerts.push({ id: `service-${node.id}-${service.name}`, severity: 'Critical', message: `Service '${service.name}' on node ${node.name} is in ${service.status} state.`, timestamp: new Date().toISOString(), resourceId: node.id, resourceType: 'Node' });
        }
      });
       if(node.updatesAvailable && node.updatesAvailable > 10) {
           newAlerts.push({ id: `updates-${node.id}`, severity: 'Info', message: `Node ${node.name} has ${node.updatesAvailable} available updates. Consider reviewing and applying them.`, timestamp: new Date().toISOString(), resourceId: node.id, resourceType: 'Node' });
       }

    });
     currentInstanceData.vms.forEach(vm => {
        if (vm.cpuUsage > (userSettings.alertThresholds.cpuUsagePercent + 10)) {
             newAlerts.push({ id: `vm-cpu-${vm.id}`, severity: 'Warning', message: `VM ${vm.name} CPU usage is ${vm.cpuUsage.toFixed(1)}%`, timestamp: new Date().toISOString(), resourceId: vm.id, resourceType: 'VM' });
        }
        if (vm.memory.percentage && vm.memory.percentage > (userSettings.alertThresholds.memoryUsagePercent + 5)) {
             newAlerts.push({ id: `vm-mem-${vm.id}`, severity: 'Warning', message: `VM ${vm.name} memory usage is ${vm.memory.percentage}%`, timestamp: new Date().toISOString(), resourceId: vm.id, resourceType: 'VM' });
        }
         if (vm.backupStatus && vm.backupStatus.status === 'Failed') {
             newAlerts.push({ id: `vm-backup-${vm.id}`, severity: 'Warning', message: `VM ${vm.name} last backup failed on ${vm.backupStatus.lastBackup}.`, timestamp: new Date().toISOString(), resourceId: vm.id, resourceType: 'VM' });
         }
    });

    setAlerts(newAlerts);
  }, [currentInstanceData, userSettings]);

  const handleAddInstance = (instance) => { // Removed type annotation
    setConfiguredInstances(prev => [...prev, instance]);
    setSelectedInstanceId(instance.id); 
    setError(null); 
  };

  const handleRemoveInstance = (instanceId) => { // Removed type annotation
    setConfiguredInstances(prev => prev.filter(inst => inst.id !== instanceId));
    if (selectedInstanceId === instanceId) {
      setSelectedInstanceId(null);
      setCurrentInstanceData(null);
      setAlerts([]);
      setError(null);
    }
  };
  
  const handleSelectInstance = (instanceId) => { // Removed type annotation
    if(instanceId !== selectedInstanceId) {
        resetGeminiChatInternal();
        setError(null); 
        setCurrentInstanceData(null); 
        setAlerts([]);
    }
    setSelectedInstanceId(instanceId);
  };

  const handleUpdateSettings = (newSettings) => { // Removed type annotation
    setUserSettings(newSettings);
  };
  
  const handleUpdateApiKey = (key) => { // Removed type annotation for key
    const newApiKey = key === '' ? MOCK_API_KEY_PLACEHOLDER : key;
    setGeminiApiKey(newApiKey);
    // process.env.API_KEY is updated by the useEffect hook for geminiApiKey
    resetGeminiChatInternal();
  };

  const handleSetupGuideDismiss = () => {
    localStorage.setItem('setupGuideCompleted', 'true');
    setShowSetupGuide(false);
  };
  
  const handleSaveApiKeyFromGuide = (key) => {
    handleUpdateApiKey(key); // This will update state and localStorage
  };

  const handleSaveInstanceFromGuide = (instance) => {
     handleAddInstance(instance); // This will update state and localStorage
     // Optionally, automatically switch to dashboard tab
     // setActiveTab('dashboard');
  };


  const renderActiveTab = () => {
    let specificErrorMessage = null;
    if (error && (error.type === "REAL_DATA_INFO" || error.type === "CONFIG_INCOMPLETE" || error.type === "CONFIG_ERROR")) {
        specificErrorMessage = error.message;
    }

    switch (activeTab) {
      case 'dashboard':
        return <InstanceDashboard instanceData={currentInstanceData} alerts={alerts} isLoading={isLoading} specificMessage={specificErrorMessage} />;
      case 'instances':
        return <InstanceConfigurator instances={configuredInstances} onAddInstance={handleAddInstance} onRemoveInstance={handleRemoveInstance} onSelectInstance={handleSelectInstance} selectedInstanceId={selectedInstanceId} />;
      case 'reports':
        return <ReportViewer instanceData={currentInstanceData} alerts={alerts} settings={userSettings} apiKeySet={isApiKeyEffectivelySet} specificMessage={specificErrorMessage} />;
      case 'assistant':
        return <GeminiProxmoxAssistant instanceData={currentInstanceData} alerts={alerts} apiKeySet={isApiKeyEffectivelySet} />;
      case 'settings':
        return <SettingsManager userSettings={userSettings} onUpdateSettings={handleUpdateSettings} apiKey={geminiApiKey} onUpdateApiKey={handleUpdateApiKey} />;
      default:
        return <InstanceDashboard instanceData={currentInstanceData} alerts={alerts} isLoading={isLoading} specificMessage={specificErrorMessage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {showSetupGuide && (
        <SetupGuide
          onSaveApiKey={handleSaveApiKeyFromGuide}
          onSaveInstance={handleSaveInstanceFromGuide}
          onDismiss={handleSetupGuideDismiss}
          currentApiKey={geminiApiKey}
        />
      )}
      <header className="bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sky-400 flex items-center">
            <SunIcon className="w-8 h-8 mr-2 text-yellow-400 animate-pulse" /> 
            {APP_TITLE}
          </h1>
          <nav className="flex space-x-1 sm:space-x-2">
            {NAV_TABS.map((tab) => ( 
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
                Gemini API Key not configured. AI features may be limited or disabled. Check Settings or the setup guide.
            </div>
        )}
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6">
        {error && error.type === "FETCH_ERROR" && <div className="bg-red-700 text-white p-3 rounded-md mb-4 shadow-lg">{error.message}</div>}
        {renderActiveTab()}
      </main>

      <footer className="bg-gray-800 text-center p-4 text-xs text-gray-500 border-t border-gray-700">
        &copy; {new Date().getFullYear()} {APP_TITLE}. For real Proxmox data, a backend is required.
      </footer>
    </div>
  );
};

export default App;
