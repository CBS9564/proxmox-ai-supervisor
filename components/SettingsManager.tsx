
import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { DEFAULT_USER_SETTINGS } from '../constants'; // MOCK_API_KEY_PLACEHOLDER not needed here anymore
import { Cog8ToothIcon, ShieldCheckIcon, AdjustmentsHorizontalIcon, BellAlertIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface SettingsManagerProps {
  userSettings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  isApiKeyConfigured: boolean;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ userSettings, onUpdateSettings, isApiKeyConfigured }) => {
  const [currentSettings, setCurrentSettings] = useState<UserSettings>(userSettings);

  useEffect(() => {
    setCurrentSettings(userSettings);
  }, [userSettings]);

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
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

  const handleSaveSettings = () => {
    onUpdateSettings(currentSettings);
    alert('Settings saved!');
  };
  
  return (
    <div className="p-6 bg-gray-800 shadow-xl rounded-lg">
      <h2 className="text-2xl font-semibold text-sky-400 mb-6 flex items-center">
        <Cog8ToothIcon className="w-8 h-8 mr-3" />
        Application Settings
      </h2>

      <div className="space-y-6">
        {/* API Key Status Display */}
        <div className="p-4 bg-gray-700 rounded-md">
          <h3 className="text-lg font-medium text-gray-200 mb-2 flex items-center">
            <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-400" />
            Gemini API Key Status
          </h3>
          {isApiKeyConfigured ? (
            <div className="flex items-center text-sm text-green-300">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              <span>Gemini API Key is configured via environment variable (API_KEY).</span>
            </div>
          ) : (
            <div className="flex items-center text-sm text-yellow-300">
              <XCircleIcon className="w-5 h-5 mr-2 text-yellow-400" />
              <span>Gemini API Key is not configured. Please set the <code>API_KEY</code> environment variable for AI features.</span>
            </div>
          )}
           <p className="text-xs text-gray-400 mt-2">
            The API key must be set as an environment variable (<code>API_KEY</code>) in the execution environment of this application. It cannot be configured through this UI.
          </p>
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
          Save Alert & Report Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsManager;
