// src/components/ProcesarDatosModal.tsx
import React, { useState } from 'react';
import { extractPersonInfo, PersonInfo } from '../lib/extractPersonInfo';

interface ProcesarDatosModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyResponses?: any[];
}

const ProcesarDatosModal: React.FC<ProcesarDatosModalProps> = ({ isOpen, onClose, surveyResponses = [] }) => {
  const [personas, setPersonas] = useState<PersonInfo[]>([]);
  const [procesado, setProcesado] = useState(false);

  if (!isOpen) return null;

  const handleProcesar = () => {
   
   
      const datos = surveyResponses.map(extractPersonInfo);
      setPersonas(datos);
      setProcesado(true);
    
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Procesar Datos</h2>
        {!procesado ? (
          <>
            <p className="mb-4">¿Deseas procesar los datos filtrados y extraer la información personal?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleProcesar}
              >
                Procesar
              </button>
            </div>
          </>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-2">Resumen de personas extraídas</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full text-xs border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Nombre</th>
                    <th className="border px-2 py-1">Documento</th>
                    <th className="border px-2 py-1">Sexo</th>
                    <th className="border px-2 py-1">Celular</th>
                    <th className="border px-2 py-1">Dirección</th>
                    <th className="border px-2 py-1">Barrio</th>
                    <th className="border px-2 py-1">Localidad</th>
                    <th className="border px-2 py-1">Edad</th>
                  </tr>
                </thead>
                <tbody>
                  {personas.map((p, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{p.nombre}</td>
                      <td className="border px-2 py-1">{p.documento}</td>
                      <td className="border px-2 py-1">{p.sexo_identidad || p.sexo_nacimiento}</td>
                      <td className="border px-2 py-1">{p.celular}</td>
                      <td className="border px-2 py-1">{p.direccion}</td>
                      <td className="border px-2 py-1">{p.barrio}</td>
                      <td className="border px-2 py-1">{p.localidad}</td>
                      <td className="border px-2 py-1">{p.edad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcesarDatosModal;
