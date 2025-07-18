import React from 'react';

interface ConfirmationPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  title,
  message,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Popup */}
      <div className="relative bg-[#232a36] rounded-2xl border border-gray-500/30 shadow-[0_8px_25px_rgba(0,0,0,0.5)] p-6 max-w-md w-full mx-4">
        {/* Title */}
        <h3 className="text-xl font-medium text-white mb-4 text-center">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-300 text-sm leading-relaxed mb-6 text-center">
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 text-sm cursor-pointer transition-colors duration-200"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg px-6 py-3 text-sm cursor-pointer transition-colors duration-200"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
