

import { Status } from '../types'; // Removed ProxmoxInstanceConfig, InstanceData, ProxmoxNode, VirtualResource, StoragePool, CpuMetric, Metric, NetworkInterface, ProxmoxService, StatusType as they are mainly for typing or unused after stripping types

const getRandom = (min, max, decimals = 0) => { // Removed type annotations
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
};

const getRandomStatus = () => { // Removed StatusType return type annotation
  const r = Math.random();
  if (r < 0.8) return Status.Running;
  if (r < 0.9) return Status.Stopped;
  if (r < 0.95) return Status.Warning; // Using for nodes/services
  return Status.Error;
};

const createMetric = (used, total, unit) => ({ // Removed Metric return type and parameter types
  used,
  total,
  unit,
  percentage: total > 0 ? parseFloat(((used / total) * 100).toFixed(1)) : 0,
});

const createCpuMetric = (cores) => { // Removed CpuMetric return type and parameter type
  const avgLoad = getRandom(5, 70, 1);
  return {
    used: avgLoad, // Representing average load as 'used' for simplicity in Metric interface
    total: 100, // Percentage
    unit: '%',
    cores,
    averageLoad: avgLoad,
    loadPerCore: Array.from({ length: cores }, () => getRandom(1, avgLoad + 10, 1)),
    percentage: avgLoad,
  };
};

const createMockNode = (index, instanceId) => { // Removed ProxmoxNode return type and parameter types
  const totalRam = [32, 64, 128, 256][getRandom(0,3)];
  const usedRam = getRandom(totalRam * 0.2, totalRam * 0.8, 1);
  const totalSwap = totalRam / 4;
  const usedSwap = getRandom(0, totalSwap * 0.5, 1);

  return {
    id: `node-${instanceId}-${index + 1}`,
    name: `pve-node-${index + 1}`,
    status: getRandomStatus(),
    cpu: createCpuMetric([4, 8, 16, 32][getRandom(0,3)]),
    memory: createMetric(usedRam, totalRam, 'GB'),
    swap: createMetric(usedSwap, totalSwap, 'GB'),
    uptime: `${getRandom(1, 30)} days, ${getRandom(0, 23)} hours`,
    storagePools: [
      { id: `local-${index}`, name: 'local', type: 'dir', metric: createMetric(getRandom(50, 150), 200, 'GB') },
      { id: `local-lvm-${index}`, name: 'local-lvm', type: 'lvmthin', metric: createMetric(getRandom(200, 700), 1000, 'GB') },
      { id: `backup-nas-${index}`, name: 'backup-nas', type: 'nfs', metric: createMetric(getRandom(1000, 3500), 4000, 'TB')}
    ],
    networkInterfaces: [
      { id: `eth0-${index}`, name: 'eth0', ipAddress: `192.168.1.${10 + index}`, trafficIn: getRandom(100, 10000, 2), trafficOut: getRandom(50, 5000, 2), errors: getRandom(0, 5) },
      { id: `vmbr0-${index}`, name: 'vmbr0', ipAddress: `10.10.0.${10 + index}`, trafficIn: getRandom(1000, 50000, 2), trafficOut: getRandom(1000, 25000, 2), errors: getRandom(0, 2) },
    ],
    services: [
      { name: 'pve-cluster', status: Math.random() > 0.1 ? Status.Ok : Status.Error }, // Corrected: Status.Ok from Status.Error for pve-cluster to make it more realistic for one service to be OK
      { name: 'pvedaemon', status: Status.Ok },
      { name: 'pveproxy', status: Status.Ok },
      { name: 'corosync', status: Status.Ok },
    ],
    temperatures: {
      'CPU Package': { value: getRandom(45, 75), unit: '°C' },
      'SSD Main': { value: getRandom(30, 45), unit: '°C' },
    },
    clusterInfo: index === 0 ? {
        name: 'MyCluster',
        version: '8.1.3',
        status: 'Online, Quorate',
        nodesOnline: 2, // Assuming 2 nodes for this mock
        nodesTotal: 2
    } : undefined,
    pveVersion: `8.1.${getRandom(0,5)}`,
    updatesAvailable: getRandom(0, 15),
  };
};

const createMockVM = (index, nodeId) => { // Removed VirtualResource return type and parameter types
  const totalRam = [2, 4, 8, 16][getRandom(0,3)];
  const usedRam = getRandom(totalRam * 0.3, totalRam * 0.9, 1);
  const totalDisk = [20, 50, 100, 200][getRandom(0,3)];
  const usedDisk = getRandom(totalDisk * 0.2, totalDisk * 0.8, 1);
  const backupStatuses = ['Success', 'Failed', 'None', 'Running'];

  return {
    id: `vm-${100 + index}`,
    type: 'VM',
    name: `webserver-${index + 1}`,
    status: getRandomStatus(),
    nodeId,
    cpuUsage: getRandom(10, 90, 1),
    memory: createMetric(usedRam, totalRam, 'GB'),
    disk: createMetric(usedDisk, totalDisk, 'GB'),
    uptime: `${getRandom(0, 10)} days, ${getRandom(0, 23)} hours`,
    ipAddress: `10.10.1.${20 + index}`,
    backupStatus: {
      lastBackup: new Date(Date.now() - getRandom(1,7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Completed this line
      status: backupStatuses[getRandom(0, backupStatuses.length - 1)],
    },
  };
};

const createMockLXC = (index, nodeId) => { // Removed VirtualResource return type and parameter types
  const totalRam = [1, 2, 4, 8][getRandom(0,3)];
  const usedRam = getRandom(totalRam * 0.2, totalRam * 0.7, 1);
  const totalDisk = [10, 20, 50, 100][getRandom(0,3)];
  const usedDisk = getRandom(totalDisk * 0.1, totalDisk * 0.6, 1);

  return {
    id: `lxc-${200 + index}`,
    type: 'LXC',
    name: `utility-container-${index + 1}`,
    status: getRandomStatus(),
    nodeId,
    cpuUsage: getRandom(5, 50, 1),
    memory: createMetric(usedRam, totalRam, 'GB'),
    disk: createMetric(usedDisk, totalDisk, 'GB'),
    uptime: `${getRandom(0, 20)} days, ${getRandom(0, 23)} hours`,
    ipAddress: `10.10.2.${30 + index}`,
    // LXCs don't typically have backup status like VMs in PVE, simplified
  };
};


export const fetchMockInstanceData = async (instanceConfig) => { // Removed ProxmoxInstanceConfig parameter type and InstanceData return type
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, getRandom(300, 1000)));

  const numNodes = getRandom(1, 3);
  const nodes = Array.from({ length: numNodes }, (_, i) => createMockNode(i, instanceConfig.id));
  
  const vms = [];
  const lxcs = [];

  nodes.forEach(node => {
    const numVMs = getRandom(1, 5);
    for (let i = 0; i < numVMs; i++) {
      vms.push(createMockVM(vms.length, node.id));
    }
    const numLXCs = getRandom(0, 3);
     for (let i = 0; i < numLXCs; i++) {
      lxcs.push(createMockLXC(lxcs.length, node.id));
    }
  });


  // Simulate a rare API error for testing
  // if (Math.random() < 0.05) {
  //   throw new Error("Mock API Error: Failed to connect to Proxmox instance (simulated).");
  // }

  return {
    id: instanceConfig.id,
    nodes,
    vms,
    lxcs,
    lastUpdated: new Date().toISOString(),
  };
};
