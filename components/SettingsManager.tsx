
import React, { useState, useEffect } from 'react';
// import { UserSettings } from '../types'; // Type for props and state
import { DEFAULT_USER_SETTINGS, MOCK_API_KEY_PLACEHOLDER } from '../constants';
import { Cog8ToothIcon, ShieldCheckIcon, AdjustmentsHorizontalIcon, BellAlertIcon } from '@heroicons/react/24/outline';

// Removed SettingsManagerProps interface

const SettingsManager = ({ userSettings, onUpdateSettings, apiKey, onUpdateApiKey }) => { // Removed React.FC and props type
  const [currentSettings, setCurrentSettings] = useState(userSettings); // Removed UserSettings type argument
  const [currentApiKey, setCurrentApiKey] = useState(apiKey); // Removed string type argument
  const [showApiKey, setShowApiKey] = useState(false); // Removed boolean type argument

  useEffect(() => {
    setCurrentSettings(userSettings);
  }, [userSettings]);

  useEffect(() => {
    setCurrentApiKey(apiKey);
  }, [apiKey]);

  const handleSettingChange = (e) => { // Removed e: React.ChangeEvent<HTMLInputElement> type
    const { name, value, type, checked } = e.target;
    const [category, key] = name.split('.');

    if (category === 'alertThresholds' && key) {
      setCurrentSettings(prev => ({
        ...prev,
        alertThresholds: {
          ...prev.alertThresholds,
          [key]: type === 'number' ? parseFloat(value) : value,
        },
      }));
    } else {
      setCurrentSettings(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      }));
    }
  };

  const handleApiKeyChange = (e) => { // Removed e: React.ChangeEvent<HTMLInputElement> type
    setCurrentApiKey(e.target.value);
  };

  const handleSaveSettings = () => {
    onUpdateSettings(currentSettings);
    onUpdateApiKey(currentApiKey);
    alert('Settings saved!');
  };
  
  const isApiKeyDefaultPlaceholder = process.env.API_KEY === MOCK_API_KEY_PLACEHOLDER;


  return (
    <div className="p-6 bg-gray-800 shadow-xl rounded-lg">
      <h2 className="text-2xl font-semibold text-sky-400 mb-6 flex items-center">
        <Cog8ToothIcon className="w-8 h-8 mr-3" />
        Application Settings
      </h2>

      <div className="space-y-6">
        {/* API Key Management */}
        <div className="p-4 bg-gray-700 rounded-md">
          <h3 className="text-lg font-medium text-gray-200 mb-2 flex items-center">
            <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-400" />
            Gemini API Key
          </h3>
          {isApiKeyDefaultPlaceholder ? (
            <>
                <p className="text-sm text-gray-400 mb-2">
                    Your Gemini API key is currently set via a placeholder. 
                    It's recommended to set the <code>API_KEY</code> environment variable for production.
                    You can override it here for this session.
                </p>
                <div className="flex items-center space-x-2">
                    <input
                    type={showApiKey ? "text" : "password"}
                    value={currentApiKey === MOCK_API_KEY_PLACEHOLDER ? '' : currentApiKey}
                    onChange={handleApiKeyChange}
                    placeholder="Enter your Gemini API Key"
                    className="flex-grow mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
                    />
                    <button onClick={() => setShowApiKey(!showApiKey)} className="p-2 text-gray-400 hover:text-gray-200">
                        {showApiKey ? "Hide" : "Show"}
                    </button>
                </div>
            </>
          ) : (
            <p className="text-sm text-green-400">Gemini API key is configured via environment variable.</p>
          )}
        </div>

        {/* Alert Thresholds */}
        <div className="p-4 bg-gray-700 rounded-md">
          <h3 className="text-lg font-medium text-gray-200 mb-3 flex items-center">
            <BellAlertIcon className="w-6 h-6 mr-2 text-yellow-400" />
            Alert Thresholds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cpuUsagePercent" className="block text-sm font-medium text-gray-300">CPU Usage (%)</label>
              <input
                type="number"
                name="alertThresholds.cpuUsagePercent"
                id="cpuUsagePercent"
                value={currentSettings.alertThresholds.cpuUsagePercent}
                onChange={handleSettingChange}
                className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="memoryUsagePercent" className="block text-sm font-medium text-gray-300">Memory Usage (%)</label>
              <input
                type="number"
                name="alertThresholds.memoryUsagePercent"
                id="memoryUsagePercent"
                value={currentSettings.alertThresholds.memoryUsagePercent}
                onChange={handleSettingChange}
                className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="diskUsagePercent" className="block text-sm font-medium text-gray-300">Disk Usage (%)</label>
              <input
                type="number"
                name="alertThresholds.diskUsagePercent"
                id="diskUsagePercent"
                value={currentSettings.alertThresholds.diskUsagePercent}
                onChange={handleSettingChange}
                className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="lowDiskFreeGb" className="block text-sm font-medium text-gray-300">Low Disk Free (GB)</label>
              <input
                type="number"
                name="alertThresholds.lowDiskFreeGb"
                id="lowDiskFreeGb"
                value={currentSettings.alertThresholds.lowDiskFreeGb}
                onChange={handleSettingChange}
                className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Report Interval */}
        <div className="p-4 bg-gray-700 rounded-md">
          <h3 className="text-lg font-medium text-gray-200 mb-2 flex items-center">
            <AdjustmentsHorizontalIcon className="w-6 h-6 mr-2 text-sky-400" />
            Report & Refresh Interval
          </h3>
          <div>
            <label htmlFor="reportIntervalHours" className="block text-sm font-medium text-gray-300">Report Interval (hours - mock)</label>
            <input
              type="number"
              name="reportIntervalHours"
              id="reportIntervalHours"
              value={currentSettings.reportIntervalHours}
              onChange={handleSettingChange}
              className="mt-1 block w-full bg-gray-600 border-gray-500 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
            />
             <p className="text-xs text-gray-400 mt-1">Note: Data refresh for dashboard is currently every 30 seconds (mock).</p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
        >
          Save All Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsManager;