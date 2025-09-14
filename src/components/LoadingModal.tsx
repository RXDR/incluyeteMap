import React from 'react';

interface LoadingModalProps {
  visible: boolean;
  message?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ visible, message }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[320px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 border-opacity-80 mb-2" style={{borderColor:'#ffa500'}}></div>
        <div className="text-xl font-bold text-gray-800 text-center">{message || 'Cargando respuestas, espere por favor...'}</div>
        <div className="text-base text-gray-500 text-center">No cierre ni recargue la página.</div>
      </div>
    </div>
  );
};

export default LoadingModal;
