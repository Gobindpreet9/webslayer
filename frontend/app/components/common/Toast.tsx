import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export interface ToastProps {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  show: boolean;
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  info: <Info size={20} />,
  warning: <AlertTriangle size={20} />,
};

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  show,
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    if (show && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  let bgColor = 'bg-gray-800 border-gray-700';
  let textColor = 'text-white';
  let iconColor = 'text-gray-400';

  switch (type) {
    case 'success':
      bgColor = 'bg-green-600 border-green-700';
      iconColor = 'text-white';
      break;
    case 'error':
      bgColor = 'bg-red-600 border-red-700';
      iconColor = 'text-white';
      break;
    case 'info':
      bgColor = 'bg-blue-600 border-blue-700';
      iconColor = 'text-white';
      break;
    case 'warning':
      bgColor = 'bg-yellow-500 border-yellow-600';
      textColor = 'text-gray-900';
      iconColor = 'text-gray-900';
      break;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-2xl ${bgColor} ${textColor} flex items-center space-x-3 border`}
          style={{ zIndex: 1000 }}
        >
          <div className={iconColor}>{icons[type]}</div>
          <span className="flex-grow">{message}</span>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-black/20 transition-colors ${iconColor}`}
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;