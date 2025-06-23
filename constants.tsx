import React from 'react';
// Removed UserSettings, TabOption from import as they are only used as type annotations here.
// Type checking will rely on the TypeScript compiler/transpiler resolving these types if used.
import { ServerIcon, ComputerDesktopIcon, ChatBubbleLeftEllipsisIcon, CogIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export const APP_TITLE = "Proxmox AI Supervisor";

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";

// Removed :UserSettings type annotation
export const DEFAULT_USER_SETTINGS = {
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

// Removed :TabOption[] type annotation
// The structure of objects in NAV_TABS implicitly matches TabOption.
// Type safety would be enforced by TypeScript during a build/check step if App.tsx uses TabOption for these.
export const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: React.createElement(ComputerDesktopIcon, { className: "w-5 h-5 mr-2" }) },
  { id: 'instances', label: 'Instances', icon: React.createElement(ServerIcon, { className: "w-5 h-5 mr-2" }) },
  { id: 'reports', label: 'Reports', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5 mr-2" }) },
  { id: 'assistant', label: 'AI Assistant', icon: React.createElement(ChatBubbleLeftEllipsisIcon, { className: "w-5 h-5 mr-2" }) },
  { id: 'settings', label: 'Settings', icon: React.createElement(CogIcon, { className: "w-5 h-5 mr-2" }) },
];

export const MOCK_API_KEY_PLACEHOLDER = "YOUR_GEMINI_API_KEY"; // Used for display only if not set