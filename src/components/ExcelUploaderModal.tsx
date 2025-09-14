import { createClient } from '@supabase/supabase-js';
// Configura tu URL y API KEY de Supabase

import React, { useState } from 'react';
// Modal de confirmación para limpiar la base de datos
function ConfirmModal({ open, onConfirm, onCancel, loading }: { open: boolean, onConfirm: () => void, onCancel: () => void, loading?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-2 text-red-600">¿Limpiar base de datos?</h2>
        <p className="mb-6 text-gray-700">Esta acción eliminará <b>todos</b> los registros de encuestas. ¿Deseas continuar?</p>
        <div className="flex justify-center gap-4">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={onCancel}
            disabled={loading}
          >Cancelar</button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold"
            onClick={onConfirm}
            disabled={loading}
          >{loading ? 'Eliminando...' : 'Sí, eliminar'}</button>
        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, X } from 'lucide-react';
import { ExcelUploader } from '@/components/excel/ExcelUploader';
import { StatsDisplay } from '@/components/excel/StatsDisplay';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggleButton from './ui/ThemeToggleButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExcelUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (stats: any) => void;
}

const ExcelUploaderModal: React.FC<ExcelUploaderModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const { isComponentDark } = useTheme();
  const isDark = isComponentDark('excelUploader');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Botón elegante para limpiar la base de datos */}
        <div className="flex justify-center mt-4 mb-2">
          <button
            className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 font-semibold shadow"
            onClick={() => setShowConfirm(true)}
          >
            Limpiar base de datos
          </button>
        </div>

        {/* Modal de confirmación */}
        <ConfirmModal
          open={showConfirm}
          loading={loadingDelete}
          onCancel={() => setShowConfirm(false)}
          onConfirm={async () => {
            setLoadingDelete(true);
         const { error } = await supabase.rpc('truncate_survey_responses');
            setLoadingDelete(false);
            setShowConfirm(false);
            if (!error) {
              toast.success('La base de datos fue limpiada correctamente.');
              setTimeout(() => window.location.reload(), 1200);
            } else {
              toast.error('Ocurrió un error al limpiar la base de datos.');
            }
          }}
        />

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
                toast.success('Archivo subido correctamente.');
                setTimeout(() => window.location.reload(), 1200);
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
