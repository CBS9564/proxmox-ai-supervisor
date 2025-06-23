
import React from 'react';
import { Metric, CpuMetric } from '../types';

interface MetricDisplayProps {
  label: string;
  metric: Metric | CpuMetric; // Union type to handle both
  icon?: React.ReactNode;
  small?: boolean;
}

const MetricDisplay: React.FC<MetricDisplayProps> = ({ label, metric, icon, small = false }) => {
  const percentage = metric.percentage ?? ('averageLoad' in metric ? metric.averageLoad : 0);
  const displayValue = 'averageLoad' in metric 
    ? `${metric.averageLoad.toFixed(1)}%` 
    : `${metric.used.toFixed(1)}${metric.unit} / ${metric.total.toFixed(1)}${metric.unit}`;

  let bgColor = 'bg-green-500';
  if (percentage > 70) bgColor = 'bg-yellow-500';
  if (percentage > 85) bgColor = 'bg-red-500';

  const textSize = small ? 'text-xs' : 'text-sm';
  const labelSize = small ? 'text-sm font-medium' : 'text-md font-semibold';
  const valueSize = small ? 'text-xs' : 'text-sm';
  const padding = small ? 'p-2' : 'p-3';

  return (
    <div className={`bg-gray-700 rounded-lg shadow ${padding}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          {icon && <span className={`mr-2 ${small ? 'w-4 h-4' : 'w-5 h-5'} text-sky-400`}>{icon}</span>}
          <h4 className={`${labelSize} text-gray-300`}>{label}</h4>
        </div>
        <span className={`${valueSize} text-gray-200`}>{displayValue}</span>
      </div>
      <div className="w-full bg-gray-600 rounded-full h-2.5">
        <div
          className={`${bgColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {'cores' in metric && metric.cores !== undefined && ( // Check if cores exists and is not undefined
        <p className={`${textSize} text-gray-400 mt-1`}>{metric.cores} Cores</p>
      )}
    </div>
  );
};

export default MetricDisplay;