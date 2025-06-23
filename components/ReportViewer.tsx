
import React, { useState, useEffect } from 'react';
import { InstanceData, Alert, UserSettings } from '../types';
import { generateProxmoxReportSummary } from '../services/geminiService';
import { DocumentChartBarIcon, ArrowDownTrayIcon, LightBulbIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ReportViewerProps {
  instanceData: InstanceData | null; // Will be null
  alerts: Alert[]; // Will be empty
  settings: UserSettings;
  apiKeySet: boolean;
  specificMessage?: string | null;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ instanceData, alerts, settings, apiKeySet, specificMessage }) => {
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>('');

  const generateReportTextContent = (): string => {
    if (specificMessage && !instanceData) { // If there's a specific message (like REAL_DATA_INFO)
        return `## Proxmox VE Status Report - ${new Date().toLocaleString()}\n\nInstance Status: ${specificMessage}\n\nNo detailed data available to include in the report body. AI summary (if generated) will be based on general knowledge.`;
    }
    if (!instanceData) { // Fallback if no specific message and no instance data
      return `## Proxmox VE Status Report - ${new Date().toLocaleString()}\n\nNo instance data available. Select an instance or ensure it's configured. Reports require data which can only be fetched with a backend component.`;
    }

    // This part is unlikely to be reached due to instanceData being null
    let report = `## Proxmox VE Status Report - ${new Date(instanceData.lastUpdated || Date.now()).toLocaleString()}\n\n`;
    report += `Instance ID: ${instanceData.id ? instanceData.id.split('-')[0] : 'N/A'}\n`;
    report += `Report Interval (settings): Every ${settings.reportIntervalHours} hours (Note: data is not live)\n\n`;

    report += "### Overall System Health\n";
    if (alerts.length === 0) {
      report += "Status: No specific alerts from available data.\n\n";
    } else {
      report += `Status: ${alerts.length} active alert(s) detected in provided data.\n\n`;
    }

    if (aiSummary) {
      report += "### AI-Powered Summary & Recommendations\n";
      report += `${aiSummary}\n\n`;
    }

    report += "### Active Alerts (from provided data)\n";
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        report += `- **[${alert.severity}]** ${alert.message} (Resource: ${alert.resourceId || 'System'}, Time: ${new Date(alert.timestamp).toLocaleTimeString()})\n`;
      });
    } else {
      report += "No active alerts in provided data.\n";
    }
    report += "\n";

    // ... (rest of the detailed report generation, which won't be hit often) ...
    report += "\n--- End of Report ---";
    return report;
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setAiSummary(''); 

    if (apiKeySet) {
        try {
            // Pass null for instanceData and empty array for alerts, as they are not available from mock
            const summary = await generateProxmoxReportSummary(null, []); 
            setAiSummary(summary);
        } catch (error) {
            console.error("Failed to get AI summary for report:", error);
            setAiSummary("Could not generate AI summary for this report. Check console.");
        }
    } else {
        setAiSummary("AI Summary disabled: Gemini API key not configured.");
    }
    // Update generatedReport text after AI summary attempt
    setGeneratedReport(generateReportTextContent());
    setIsGenerating(false); 
  };
  
  useEffect(() => {
    // Generate initial report text based on current state (instanceData, specificMessage, aiSummary)
    setGeneratedReport(generateReportTextContent());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceData, alerts, aiSummary, settings.reportIntervalHours, specificMessage]);


  const downloadReport = () => {
    const reportToDownload = generatedReport; // Use the state which includes AI summary
    if (!reportToDownload || reportToDownload.includes("No instance data available")) return;

    const blob = new Blob([reportToDownload], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const instanceNameForFile = instanceData?.id.split('-')[0] || 'General';
    link.setAttribute("download", `Proxmox_Report_${instanceNameForFile}_${new Date().toISOString().split('T')[0]}.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (specificMessage && !instanceData) { 
    return (
      <div className="p-6 bg-gray-800 shadow-xl rounded-lg text-center">
        <InformationCircleIcon className="w-12 h-12 text-sky-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-sky-300 mb-2">Report Information</h3>
        <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto">{specificMessage}</p>
        <p className="text-sm text-gray-500 mt-2">Reports can be generated with an AI summary, but will lack specific instance data.</p>
         <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="mt-4 flex items-center mx-auto px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
            {isGenerating ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <LightBulbIcon className="w-5 h-5 mr-2" />
            )}
            {isGenerating ? 'Generating AI Summary...' : 'Generate AI Summary (General)'}
        </button>
        {aiSummary && (
            <div className="mt-4 bg-gray-700 p-3 rounded-md shadow-inner text-left">
                 <h4 className="text-md font-semibold text-sky-300 mb-2">AI Summary:</h4>
                <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">{aiSummary}</pre>
            </div>
        )}
      </div>
    );
  }
  
  // Default message if no instance is selected and no specific error shown from App.tsx
  if (!instanceData && !specificMessage) { 
    return (
      <div className="p-6 bg-gray-800 shadow-xl rounded-lg text-center">
        <DocumentChartBarIcon className="w-12 h-12 text-sky-500 mx-auto mb-3" />
        <p className="text-gray-400">Select an instance to generate reports. Note: Live data requires a backend.</p>
         <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !apiKeySet}
            className="mt-4 flex items-center mx-auto px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
            {isGenerating ? "Generating..." : <LightBulbIcon className="w-5 h-5 mr-2" />}
            Generate General AI Summary
        </button>
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
            disabled={isGenerating} // Enable even if instanceData is null to get general AI summary
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
            disabled={!generatedReport || generatedReport.includes("No instance data available")}
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
            Gemini API key is not configured. AI-powered summary generation is disabled. Please set it in Settings or via environment variable.
        </div>
      )}

      {isGenerating && (
        <div className="text-center my-4">
          <p className="text-sky-300">Generating AI summary, please wait...</p>
        </div>
      )}
      
      <div className="bg-gray-700 p-4 rounded-md shadow-inner max-h-[60vh] overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
          {generatedReport || "Select an instance and click 'Generate AI Summary' for a general Proxmox summary."}
        </pre>
      </div>
    </div>
  );
};

export default ReportViewer;
