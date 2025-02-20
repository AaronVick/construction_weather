// src/components/charts/LineChart.tsx
import React, { useState } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';

export interface LineChartDataPoint {
  [key: string]: any;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  lines: {
    key: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  tooltipFormatter?: (value: any, name: string) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  title,
  subtitle,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  tooltipFormatter,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
}) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Colors based on theme
  const textColor = darkMode ? '#e2e8f0' : '#1f2937';
  const gridColor = darkMode ? '#4b5563' : '#e5e7eb';
  const backgroundColor = darkMode ? '#1f2937' : '#ffffff';
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    
    return (
      <div className={`p-3 rounded-md shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.name}:
              </span>
              <span className={`ml-1 text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {tooltipFormatter
                  ? tooltipFormatter(item.value, item.name)
                  : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const handleMouseMove = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined) {
      setActiveIndex(e.activeTooltipIndex);
    }
  };
  
  const handleMouseLeave = () => {
    setActiveIndex(null);
  };
  
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mx-auto"></div>
            <div className="space-y-2 mt-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {emptyMessage}
          </p>
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
          )}
          
          {showXAxis && (
            <XAxis
              dataKey={xAxisKey}
              label={
                xAxisLabel ? {
                  value: xAxisLabel,
                  position: 'insideBottomRight',
                  offset: -10,
                  fill: textColor,
                } : undefined
              }
              tick={{ fill: textColor }}
              tickLine={{ stroke: textColor }}
              axisLine={{ stroke: gridColor }}
            />
          )}
          
          {showYAxis && (
            <YAxis
              label={
                yAxisLabel ? {
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                  fill: textColor,
                } : undefined
              }
              tick={{ fill: textColor }}
              tickLine={{ stroke: textColor }}
              axisLine={{ stroke: gridColor }}
            />
          )}
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '10px',
                color: textColor,
              }}
            />
          )}
          
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 0, fill: line.color }}
              activeDot={{ r: 6, strokeWidth: 0, fill: line.color }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <div
      className={`rounded-lg overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } p-5 ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="relative h-full">
        {renderChart()}
      </div>
    </div>
  );
};

export default LineChart;