
import React from 'react';
import { Status } from '../types'; // Import Status object
import MetricDisplay from './MetricDisplay';
import { ServerIcon, CpuChipIcon, ArchiveBoxIcon, WifiIcon, ShieldExclamationIcon, InformationCircleIcon, CloudIcon, CubeIcon, CogIcon, CircleStackIcon, ClockIcon, InboxStackIcon, WrenchScrewdriverIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

// Removed InstanceDashboardProps interface

const StatusIndicator = ({ status }) => { // Removed React.FC and type annotation
  let color = 'bg-gray-500'; // Unknown
  if (status === Status.Running || status === Status.Ok) color = 'bg-green-500';
  else if (status === Status.Stopped) color = 'bg-yellow-500';
  else if (status === Status.Suspended) color = 'bg-blue-500';
  else if (status === Status.Error || status === Status.Critical) color = 'bg-red-500';
  else if (status === Status.Warning) color = 'bg-orange-400';
  return <span className={`inline-block w-3 h-3 ${color} rounded-full mr-2`} title={status}></span>;
};

const NodeCard = ({ node }) => ( // Removed React.FC and type annotation
  <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-xl font-semibold text-sky-400 flex items-center">
        <ServerIcon className="w-6 h-6 mr-2" />
        {node.name}
      </h3>
      <div className="flex items-center">
        <StatusIndicator status={node.status} />
        <span className="text-sm text-gray-400">{node.status}</span>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      <MetricDisplay label="CPU" metric={node.cpu} icon={<CpuChipIcon />} small />
      <MetricDisplay label="Memory" metric={node.memory} icon={<ArchiveBoxIcon />} small />
    </div>
     {node.swap.total > 0 && <MetricDisplay label="Swap" metric={node.swap} icon={<CircleStackIcon />} small />}

    <div className="mt-3 space-y-2">
      <h4 className="text-md font-semibold text-gray-300 mt-4 mb-2">Storage Pools</h4>
      {node.storagePools.map(pool => (
        <MetricDisplay key={pool.id} label={pool.name} metric={pool.metric} icon={<InboxStackIcon />} small />
      ))}
    </div>

    {node.clusterInfo && (
         <div className="mt-4 p-3 bg-gray-700 rounded">
            <h4 className="text-sm font-semibold text-gray-300 mb-1 flex items-center"><CloudIcon className="w-4 h-4 mr-2"/>Cluster: {node.clusterInfo.name}</h4>
            <p className="text-xs text-gray-400">Version: {node.clusterInfo.version} | Status: {node.clusterInfo.status}</p>
            <p className="text-xs text-gray-400">Nodes: {node.clusterInfo.nodesOnline}/{node.clusterInfo.nodesTotal} online</p>
        </div>
    )}
    <div className="mt-3 text-xs text-gray-400">
        <p className="flex items-center"><ClockIcon className="w-4 h-4 mr-1"/>Uptime: {node.uptime}</p>
        <p className="flex items-center"><CogIcon className="w-4 h-4 mr-1"/>PVE Version: {node.pveVersion} {node.updatesAvailable ? `(${node.updatesAvailable} updates)` : ''}</p>
    </div>
     <div className="mt-3">
        <h4 className="text-sm font-semibold text-gray-300 mb-1">Services</h4>
        <div className="flex flex-wrap gap-2">
        {node.services.map(service => (
            <span key={service.name} className={`text-xs px-2 py-1 rounded-full ${service.status === Status.Ok ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'}`}>
            {service.name}: {service.status}
            </span>
        ))}
        </div>
    </div>
  </div>
);

const VirtualResourceCard = ({ resource }) => ( // Removed React.FC and type annotation
  <div className="bg-gray-800 p-3 rounded-lg shadow">
    <div className="flex justify-between items-center mb-2">
      <h4 className="text-lg font-medium text-sky-500 flex items-center">
        {resource.type === 'VM' ? <ComputerDesktopIcon className="w-5 h-5 mr-2" /> : <CubeIcon className="w-5 h-5 mr-2" />}
        {resource.name} <span className="text-xs text-gray-500 ml-1">({resource.id})</span>
      </h4>
      <div className="flex items-center">
        <StatusIndicator status={resource.status} />
        <span className="text-xs text-gray-400">{resource.status}</span>
      </div>
    </div>
    <div className="space-y-1 text-sm">
      <p className="text-gray-400">Node: <span className="text-gray-300">{resource.nodeId.split('-').slice(-2).join('-')}</span></p>
      <p className="text-gray-400">CPU Usage: <span className="text-gray-300">{resource.cpuUsage.toFixed(1)}%</span></p>
      <p className="text-gray-400">Memory: <span className="text-gray-300">{resource.memory.used.toFixed(1)}{resource.memory.unit} / {resource.memory.total.toFixed(1)}{resource.memory.unit} ({resource.memory.percentage}%)</span></p>
      <p className="text-gray-400">Disk: <span className="text-gray-300">{resource.disk.used.toFixed(1)}{resource.disk.unit} / {resource.disk.total.toFixed(1)}{resource.disk.unit} ({resource.disk.percentage}%)</span></p>
      {resource.ipAddress && <p className="text-gray-400">IP: <span className="text-gray-300">{resource.ipAddress}</span></p>}
      {resource.backupStatus && (
        <p className={`text-xs ${
            resource.backupStatus.status === 'Success' ? 'text-green-400' : 
            resource.backupStatus.status === 'Failed' ? 'text-red-400' : 
            resource.backupStatus.status === 'Running' ? 'text-blue-400' : 'text-gray-400'
        }`}>
            Last Backup: {resource.backupStatus.lastBackup} ({resource.backupStatus.status})
        </p>
      )}
    </div>
  </div>
);


const InstanceDashboard = ({ instanceData, alerts, isLoading, specificMessage }) => { // Added specificMessage prop
  if (isLoading) {
    return <div className="text-center p-10"><WrenchScrewdriverIcon className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />Fetching data...</div>;
  }

  if (specificMessage) {
    return (
      <div className="p-6 bg-gray-800 shadow-xl rounded-lg text-center">
        <InformationCircleIcon className="w-12 h-12 text-sky-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-sky-300 mb-2">Instance Information</h3>
        <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto">{specificMessage}</p>
      </div>
    );
  }

  if (!instanceData) {
    return <div className="text-center p-10 text-gray-400">Select an instance to view its dashboard, or add a new one. Ensure instance configuration is complete.</div>;
  }
  
  const systemAlerts = alerts.filter(a => a.resourceType === 'System' || !a.resourceType);
  const nodeAlerts = alerts.filter(a => a.resourceType === 'Node');
  const vmAlerts = alerts.filter(a => a.resourceType === 'VM');
  const lxcAlerts = alerts.filter(a => a.resourceType === 'LXC');


  return (
    <div className="space-y-8 p-1">
      <div>
        <h2 className="text-3xl font-bold text-sky-300 mb-2">Instance: {instanceData.id.split('-')[0]} Overview</h2>
        <p className="text-sm text-gray-500">Last updated: {new Date(instanceData.lastUpdated).toLocaleString()} (Mock Data)</p>
      </div>

      { (systemAlerts.length + nodeAlerts.length > 0) && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-red-400 mb-2 flex items-center">
            <ShieldExclamationIcon className="w-6 h-6 mr-2" /> Critical System & Node Alerts
          </h3>
          <div className="space-y-2">
            {[...systemAlerts, ...nodeAlerts].map(alert => (
              <div key={alert.id} className={`p-3 rounded-md shadow ${alert.severity === 'Critical' ? 'bg-red-700' : 'bg-yellow-700'}`}>
                <p className="font-medium text-white">{alert.message}</p>
                <p className="text-xs text-gray-200">
                  {alert.resourceId ? `Resource: ${alert.resourceId} - ` : ''} 
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}


      <div>
        <h3 className="text-2xl font-semibold text-gray-200 mb-4">Nodes ({instanceData.nodes.length})</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {instanceData.nodes.map(node => <NodeCard key={node.id} node={node} />)}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-gray-200 mb-4">Virtual Machines ({instanceData.vms.length})</h3>
        {instanceData.vms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instanceData.vms.map(vm => <VirtualResourceCard key={vm.id} resource={vm} />)}
          </div>
        ) : <p className="text-gray-400">No VMs found for this instance.</p>}
         {vmAlerts.length > 0 && (
          <div className="mt-4 space-y-1">
            {vmAlerts.map(alert => (
              <p key={alert.id} className={`text-sm ${alert.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                <InformationCircleIcon className="w-4 h-4 inline mr-1"/> {alert.message} (VM: {alert.resourceId})
              </p>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-gray-200 mb-4">LXC Containers ({instanceData.lxcs.length})</h3>
        {instanceData.lxcs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instanceData.lxcs.map(lxc => <VirtualResourceCard key={lxc.id} resource={lxc} />)}
          </div>
        ) : <p className="text-gray-400">No LXC containers found for this instance.</p>}
        {lxcAlerts.length > 0 && (
            <div className="mt-4 space-y-1">
            {lxcAlerts.map(alert => (
                <p key={alert.id} className={`text-sm ${alert.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                <InformationCircleIcon className="w-4 h-4 inline mr-1"/> {alert.message} (LXC: {alert.resourceId})
                </p>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default InstanceDashboard;
