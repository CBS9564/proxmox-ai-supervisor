

import React, { useState, useEffect } from 'react';
// import { InstanceData, Alert, UserSettings } from '../types'; // Types for props and state
import { generateProxmoxReportSummary } from '../services/geminiService';
import { DocumentChartBarIcon, ArrowDownTrayIcon, LightBulbIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

// Removed ReportViewerProps interface

const ReportViewer = ({ instanceData, alerts, settings, apiKeySet, specificMessage }) => { // Added specificMessage prop
  const [generatedReport, setGeneratedReport] = useState(''); // Removed string type argument
  const [isGenerating, setIsGenerating] = useState(false); // Removed boolean type argument
  const [aiSummary, setAiSummary] = useState(''); // Removed string type argument

  const generateReportText = () => {
    if (!instanceData) return "No instance data available to generate a report.";

    let report = `## Proxmox VE Status Report - ${new Date(instanceData.lastUpdated).toLocaleString()}\n\n`;
    report += `Instance ID: ${instanceData.id.split('-')[0]} (Mock Data)\n`;
    report += `Report Interval (settings): Every ${settings.reportIntervalHours} hours (mock)\n\n`;

    report += "### Overall System Health\n";
    if (alerts.length === 0) {
      report += "Status: All systems nominal.\n\n";
    } else {
      report += `Status: ${alerts.length} active alert(s) detected.\n\n`;
    }

    if (aiSummary) {
      report += "### AI-Powered Summary & Recommendations\n";
      report += `${aiSummary}\n\n`;
    }

    report += "### Active Alerts\n";
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        report += `- **[${alert.severity}]** ${alert.message} (Resource: ${alert.resourceId || 'System'}, Time: ${new Date(alert.timestamp).toLocaleTimeString()})\n`;
      });
    } else {
      report += "No active alerts.\n";
    }
    report += "\n";

    instanceData.nodes.forEach(node => {
      report += `### Node: ${node.name}\n`;
      report += `- Status: ${node.status}\n`;
      report += `- CPU Usage: ${node.cpu.averageLoad.toFixed(1)}% (${node.cpu.cores} cores)\n`;
      report += `- Memory Usage: ${node.memory.percentage}% (${node.memory.used.toFixed(1)}${node.memory.unit} / ${node.memory.total.toFixed(1)}${node.memory.unit})\n`;
      if (node.swap.total > 0) {
         report += `- Swap Usage: ${node.swap.percentage}% (${node.swap.used.toFixed(1)}${node.swap.unit} / ${node.swap.total.toFixed(1)}${node.swap.unit})\n`;
      }
      report += `- PVE Version: ${node.pveVersion}, Updates: ${node.updatesAvailable ?? 'N/A'}\n`;
      report += "- Storage:\n";
      node.storagePools.forEach(sp => {
        report += `  - ${sp.name} (${sp.type}): ${sp.metric.percentage}% used (${sp.metric.used.toFixed(1)}${sp.metric.unit} of ${sp.metric.total.toFixed(1)}${sp.metric.unit})\n`;
      });
      if(node.clusterInfo) {
        report += `- Cluster: ${node.clusterInfo.name} (${node.clusterInfo.status}, ${node.clusterInfo.nodesOnline}/${node.clusterInfo.nodesTotal} nodes)\n`;
      }
      report += "\n";
    });

    report += "### Virtual Machines\n";
    if (instanceData.vms.length > 0) {
      instanceData.vms.forEach(vm => {
        report += `- ${vm.name} (ID: ${vm.id}, Node: ${vm.nodeId.split('-').slice(-2).join('-')}, Status: ${vm.status})\n`;
        report += `  - CPU: ${vm.cpuUsage.toFixed(1)}%, Memory: ${vm.memory.percentage}% (${vm.memory.used.toFixed(1)}${vm.memory.unit})\n`;
      });
    } else {
      report += "No VMs reported.\n";
    }
    report += "\n";

    report += "### LXC Containers\n";
    if (instanceData.lxcs.length > 0) {
      instanceData.lxcs.forEach(lxc => {
        report += `- ${lxc.name} (ID: ${lxc.id}, Node: ${lxc.nodeId.split('-').slice(-2).join('-')}, Status: ${lxc.status})\n`;
        report += `  - CPU: ${lxc.cpuUsage.toFixed(1)}%, Memory: ${lxc.memory.percentage}% (${lxc.memory.used.toFixed(1)}${lxc.memory.unit})\n`;
      });
    } else {
      report += "No LXC containers reported.\n";
    }
    report += "\n--- End of Report ---";
    return report;
  };

  const handleGenerateReport = async () => {
    if (!instanceData) {
      setGeneratedReport("No data to generate report. Select an instance or check configuration.");
      return;
    }
    setIsGenerating(true);
    setAiSummary(''); // Clear previous summary

    if (apiKeySet) {
        try {
            const summary = await generateProxmoxReportSummary(instanceData, alerts);
            setAiSummary(summary);
        } catch (error) {
            console.error("Failed to get AI summary for report:", error);
            setAiSummary("Could not generate AI summary for this report.");
        }
    } else {
        setAiSummary("AI Summary disabled: Gemini API key not configured.");
    }
    setIsGenerating(false); 
  };
  
  useEffect(() => {
    if (instanceData) {
        setGeneratedReport(generateReportText());
    } else {
        // If no instanceData (e.g. specificMessage is shown), clear the report text
        // or set a placeholder.
        setGeneratedReport(specificMessage ? "" : "Select an instance and ensure data is loaded to generate reports.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceData, alerts, aiSummary, settings.reportIntervalHours, specificMessage]);


  const downloadReport = () => {
    const reportToDownload = generateReportText(); // Ensure fresh text with latest AI summary
    if (!reportToDownload || reportToDownload === "No instance data available to generate a report.") return;

    const blob = new Blob([reportToDownload], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Proxmox_Report_${instanceData?.id.split('-')[0] || 'UnknownInstance'}_${new Date().toISOString().split('T')[0]}.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (specificMessage && !instanceData) { // Display specific message if instanceData is not available for this reason
    return (
      <div className="p-6 bg-gray-800 shadow-xl rounded-lg text-center">
        <InformationCircleIcon className="w-12 h-12 text-sky-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-sky-300 mb-2">Report Information</h3>
        <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto">{specificMessage}</p>
        <p className="text-sm text-gray-500 mt-2">Reports cannot be generated without instance data.</p>
      </div>
    );
  }
  
  if (!instanceData) { // General case for no instance data
    return (
      <div className="p-6 bg-gray-800 shadow-xl rounded-lg text-center">
        <DocumentChartBarIcon className="w-12 h-12 text-sky-500 mx-auto mb-3" />
        <p className="text-gray-400">Select an instance and ensure data is loaded to generate reports.</p>
      </div>
    );
  }


  return (
    <div className="p-6 bg-gray-800 shadow-xl rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
          <DocumentChartBarIcon className="w-8 h-8 mr-3" />
          System Report
        </h2>
        <div className="flex gap-2">
            <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !instanceData}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
            {isGenerating ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <LightBulbIcon className="w-5 h-5 mr-2" />
            )}
            {isGenerating ? 'Generating AI Summary...' : (aiSummary && aiSummary !== "AI Summary disabled: Gemini API key not configured." && !aiSummary.startsWith("Could not generate")) ? 'Regenerate AI Summary' : 'Generate AI Summary'}
            </button>
            <button
            onClick={downloadReport}
            disabled={!generatedReport || generatedReport === "No data to generate report." || !instanceData}
            className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Download Report
            </button>
        </div>
      </div>

      {!apiKeySet && (
         <div className="mb-4 p-3 bg-yellow-700 text-yellow-100 rounded-md text-sm">
            <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
            Gemini API key is not configured. AI-powered summary generation is disabled. Please set it in Settings.
        </div>
      )}

      {isGenerating && (
        <div className="text-center my-4">
          <p className="text-sky-300">Generating AI summary, please wait...</p>
        </div>
      )}
      
      <div className="bg-gray-700 p-4 rounded-md shadow-inner max-h-[60vh] overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
          {generatedReport || "Click 'Generate AI Summary' (if data is available) or check instance selection."}
        </pre>
      </div>
    </div>
  );
};

export default ReportViewer;
