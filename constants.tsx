
import React from 'react';
import { UserSettings, TabOption } from './types';
import { ServerIcon, ComputerDesktopIcon, ChatBubbleLeftEllipsisIcon, CogIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export const APP_TITLE = "Proxmox AI Supervisor";

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  reportIntervalHours: 4,
  alertThresholds: {
    cpuUsagePercent: 80,
    memoryUsagePercent: 85,
    diskUsagePercent: 90,
    lowDiskFreeGb: 20,
  },
};

export const MOCK_DATA_REFRESH_INTERVAL_MS = 30000; // 30 seconds for mock data "refresh"
export const MAX_CHAT_HISTORY = 20;

export const NAV_TABS: TabOption[] = [
  { id: 'dashboard', label: 'Dashboard', icon: React.createElement(ComputerDesktopIcon, { className: "w-5 h-5 mr-2" }) },
  { id: 'instances', label: 'Instances', icon: React.createElement(ServerIcon, { className: "w-5 h-5 mr-2" }) },
  { id: 'reports', label: 'Reports', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5 mr-2" }) },
  { id: 'assistant', label: 'AI Assistant', icon: React.createElement(ChatBubbleLeftEllipsisIcon, { className: "w-5 h-5 mr-2" }) },
  { id: 'settings', label: 'Settings', icon: React.createElement(CogIcon, { className: "w-5 h-5 mr-2" }) },
];

export const MOCK_API_KEY_PLACEHOLDER = "YOUR_GEMINI_API_KEY"; // Used for display only if not set
