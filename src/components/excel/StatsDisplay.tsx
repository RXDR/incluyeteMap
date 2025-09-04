import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, MapPin, Database, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { ProcessingStats } from '@/types/excel';

interface StatsDisplayProps {
  stats: ProcessingStats;
  isProcessing?: boolean;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats, isProcessing = false }) => {
  const successRate = stats.totalRecords > 0 ? (stats.successful / stats.totalRecords) * 100 : 0;
  const categoryRate = stats.totalRecords > 0 ? (stats.withCategory / stats.totalRecords) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Resumen del Procesamiento
          </CardTitle>
          <CardDescription>
            Estadísticas detalladas del último procesamiento de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-900">{stats.totalRecords.toLocaleString()}</div>
              <div className="text-sm text-blue-700">Total Registros</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-900">{stats.successful.toLocaleString()}</div>
              <div className="text-sm text-green-700">Exitosos</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-900">{stats.failed.toLocaleString()}</div>
              <div className="text-sm text-red-700">Fallidos</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-900">{(stats.processingTime / 1000).toFixed(1)}s</div>
              <div className="text-sm text-purple-700">Tiempo Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasas de Éxito */}
      <Card>
        <CardHeader>
          <CardTitle>Tasas de Éxito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Tasa de Éxito General</span>
              <span className="text-sm text-gray-600">{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Registros con Categoría</span>
              <span className="text-sm text-gray-600">{categoryRate.toFixed(1)}%</span>
            </div>
            <Progress value={categoryRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Distribución por Categorías */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Distribución de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por Categoría */}
            <div>
              <h4 className="font-medium mb-3">Por Categoría</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Con Categoría</span>
                  <Badge variant="default">{stats.withCategory.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sin Categoría (Otros)</span>
                  <Badge variant="secondary">{stats.withoutCategory.toLocaleString()}</Badge>
                </div>
              </div>
            </div>

            {/* Categorías Encontradas */}
            <div>
              <h4 className="font-medium mb-3">Categorías Encontradas</h4>
              <div className="space-y-2">
                {stats.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {stats.categories.map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No se detectaron categorías específicas</div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Total: {stats.categories.length} categorías
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Registros/segundo</div>
              <div className="font-bold">
                {stats.processingTime > 0 ? 
                  Math.round(stats.totalRecords / (stats.processingTime / 1000)) : 0
                }
              </div>
            </div>
            <div>
              <div className="text-gray-600">Tiempo promedio/registro</div>
              <div className="font-bold">
                {stats.totalRecords > 0 ? 
                  (stats.processingTime / stats.totalRecords).toFixed(2) : 0
                }ms
              </div>
            </div>
            <div>
              <div className="text-gray-600">Memoria aproximada</div>
              <div className="font-bold">
                {((stats.totalRecords * 2) / 1024).toFixed(1)}KB
              </div>
            </div>
            <div>
              <div className="text-gray-600">Estado</div>
              <div className="font-bold text-green-600">
                {isProcessing ? 'Procesando...' : 'Completado'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsDisplay;