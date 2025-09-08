import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, X } from 'lucide-react';
import { ExcelUploader } from '@/components/excel/ExcelUploader';
import { StatsDisplay } from '@/components/excel/StatsDisplay';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggleButton from './ui/ThemeToggleButton';

interface ExcelUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (stats: any) => void;
}

const ExcelUploaderModal: React.FC<ExcelUploaderModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const { isComponentDark } = useTheme();
  const isDark = isComponentDark('excelUploader');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${
        isDark ? 'bg-gray-800' : 'bg-white'
      } rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        <Card className="border-0 bg-transparent text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileSpreadsheet className="h-5 w-5" />
              Carga de Archivo Excel
            </CardTitle>
            <CardDescription className="text-gray-300">
              Sube tu archivo Excel para comenzar la migración inteligente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExcelUploader 
              onUploadComplete={(stats) => {
                onUploadComplete(stats);
                onClose();
              }} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExcelUploaderModal;
