
export interface ProxmoxInstanceConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiToken: string; // Stored, but not actually used to connect in this mock version
}

// Converted Status enum to a plain JS object
export const Status = {
  Running: 'Running',
  Stopped: 'Stopped',
  Suspended: 'Suspended',
  Error: 'Error',
  Unknown: 'Unknown',
  Ok: 'OK',
  Warning: 'Warning',
  Critical: 'Critical',
};
// Ensure Status type can still be used for type checking if TS is processed
export type StatusType = typeof Status[keyof typeof Status];


export interface Metric {
  used: number;
  total: number;
  unit: string; // e.g., 'GB', 'TB', '%'
  percentage?: number; 
}

export interface CpuMetric extends Metric {
  cores?: number; // Total cores
  loadPerCore?: number[]; // Load per core as percentage
  averageLoad: number; // Overall average load as percentage
}

export interface StoragePool {
  id: string;
  name: string;
  type: string;
  metric: Metric;
}

export interface NetworkInterface {
  id: string;
  name: string;
  ipAddress?: string;
  trafficIn: number; // MB
  trafficOut: number; // MB
  errors: number;
}

export interface ProxmoxService {
  name: string;
  status: StatusType; // Use StatusType for type checking
}

export interface ProxmoxNode {
  id: string;
  name: string;
  status: StatusType; // Use StatusType
  cpu: CpuMetric;
  memory: Metric;
  swap: Metric;
  uptime: string; // e.g. "10 days, 5 hours"
  storagePools: StoragePool[];
  networkInterfaces: NetworkInterface[];
  services: ProxmoxService[];
  temperatures?: { [sensor: string]: { value: number; unit: '°C' | '°F' } };
  clusterInfo?: { name: string; version: string; status: string; nodesOnline: number; nodesTotal: number };
  pveVersion: string;
  updatesAvailable?: number;
}

export interface VirtualResource {
  id: string; // vmid or ctid
  type: 'VM' | 'LXC';
  name: string;
  status: StatusType; // Use StatusType
  nodeId: string;
  cpuUsage: number; // percentage
  memory: Metric;
  disk: Metric; // Root disk
  uptime?: string;
  ipAddress?: string;
  backupStatus?: { lastBackup: string; status: 'Success' | 'Failed' | 'None' | 'Running' };
}

export interface InstanceData {
  id: string; // Corresponds to ProxmoxInstanceConfig id
  nodes: ProxmoxNode[];
  vms: VirtualResource[];
  lxcs: VirtualResource[];
  lastUpdated: string;
}

export interface Alert {
  id: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  timestamp: string;
  resourceId?: string;
  resourceType?: 'Node' | 'VM' | 'LXC' | 'System';
}

export interface UserSettings {
  reportIntervalHours: number; // e.g., 1, 4, 24
  alertThresholds: {
    cpuUsagePercent: number; // e.g., 80
    memoryUsagePercent: number; // e.g., 85
    diskUsagePercent: number; // e.g., 90
    lowDiskFreeGb: number; // e.g. 10
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  isLoading?: boolean;
}

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}