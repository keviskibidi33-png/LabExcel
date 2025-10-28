import React from 'react';
import { ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string;
  type?: 'error' | 'warning' | 'info';
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details,
  type = 'error'
}) => {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'info':
        return {
          icon: <InformationCircleIcon className="w-6 h-6 text-blue-600" />,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
      default: // error
        return {
          icon: <XCircleIcon className="w-6 h-6 text-red-600" />,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
    }
  };

  const { icon, iconBg, iconColor, buttonClass } = getIconAndColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Header del modal */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-10 h-10 mx-auto ${iconBg} rounded-full flex items-center justify-center`}>
              {icon}
            </div>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="px-6 py-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Información adicional */}
          {details && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start text-sm text-gray-600">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800 mb-1">Detalles del problema:</p>
                  <p className="text-xs text-gray-600 break-words">{details}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className={`px-6 py-3 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${buttonClass}`}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
