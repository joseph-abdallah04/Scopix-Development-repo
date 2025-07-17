import React from 'react';

interface MeasurementLayoutProps {
  children: React.ReactNode;
}

const MeasurementLayout: React.FC<MeasurementLayoutProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Content with top padding for fixed header */}
      <div className="flex-1 flex gap-4 p-4 pt-24 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MeasurementLayout;