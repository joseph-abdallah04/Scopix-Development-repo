import React from 'react';
import { GoArrowLeft } from "react-icons/go";
import { useTheme } from '../contexts/theme-context';

interface MeasurementHeaderProps {
  frameIdx: number;
  timestamp: number;
  onBack: () => void;
}

const MeasurementHeader: React.FC<MeasurementHeaderProps> = ({
  frameIdx,
  timestamp,
  onBack
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="fixed top-4 left-8 right-8 z-50">
      <div className={`backdrop-blur rounded-2xl px-6 py-3 border flex justify-between items-center relative transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#232a36]/75 border-gray-500/30 shadow-[0_8px_25px_rgba(148,163,184,0.25)]' 
          : 'bg-[#4a5568]/90 border-gray-400/50 shadow-[0_2px_20px_rgba(0,0,0,0.4)]'
      }`}>
        {/* Back Button */}
        <button 
          onClick={onBack} 
          className={`border-none rounded-lg px-4 py-2 text-sm cursor-pointer transition-all duration-200 flex items-center gap-2 backdrop-blur ${
            isDarkMode 
              ? 'bg-gray-700/50 hover:bg-gray-500/70 text-white' 
              : 'bg-gray-700/50 hover:bg-gray-500/70 text-white'
          }`}
        >
          <GoArrowLeft />
          Back to Video Analysis
        </button>
        
        {/* Central Title and Frame Info */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className={`flex gap-6 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-200'
          }`}>
            <span className={`rounded-full px-3 py-1 transition-colors duration-300 ${
              isDarkMode ? 'bg-white/10' : 'bg-white/20'
            }`}>Frame: {frameIdx}</span>
            <span className={`rounded-full px-3 py-1 transition-colors duration-300 ${
              isDarkMode ? 'bg-white/10' : 'bg-white/20'
            }`}>Time: {timestamp.toFixed(3)}s</span>
          </div>
        </div>
        
        {/* Right side spacer to balance the layout */}
        <div className="w-[200px]"></div>
      </div>
    </div>
  );
};

export default MeasurementHeader;