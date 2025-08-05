import React from 'react';
import { useTheme } from '../contexts/theme-context';

interface MeasurementLayoutProps {
  children: React.ReactNode;
}

const MeasurementLayout: React.FC<MeasurementLayoutProps> = ({ children }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`w-screen h-screen min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Content with top padding for fixed header */}
      <div className="flex-1 flex gap-4 p-4 pt-24 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MeasurementLayout;