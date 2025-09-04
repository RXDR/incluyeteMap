import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, XCircle, Loader2, Bug, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SupabaseConnectionTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [tableDetails, setTableDetails] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    console.log('🧪 ===== INICIANDO TEST DE CONEXIÓN SIMPLIFICADO =====');
    setIsTesting(true);
    setConnectionStatus('idle');
    setErrorMessage('');
    setDebugInfo(null);

    try {
      console.log('🔍 Verificando configuración del cliente...');
      
      // Información del cliente y entorno
      const clientInfo = {
        url: import.meta.env.VITE_SUPABASE_URL || 'No configurada',
        key: 'Configurada desde .env',
        headers: 'Presente'
      };

      console.log('📋 Información del cliente:', clientInfo);

      const envInfo = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Presente' : 'Ausente',
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      };

      console.log('🌍 Variables de entorno:', envInfo);

      // Test simple: Solo SELECT básico
      console.log('🔄 Iniciando Test SIMPLE: SELECT básico...');
      
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: SELECT tardó más de 5 segundos')), 5000);
        });
        
        const selectPromise = supabase
          .from('temp_excel_import')
          .select('id')
          .limit(1);
        
        const { data, error } = await Promise.race([selectPromise, timeoutPromise]) as any;
        
        console.log('✅ SELECT completado:', { data, error });
        
        if (error) {
          throw new Error(`Error en SELECT: ${error.message}`);
        }
        
        setConnectionStatus('success');
        toast({
          title: "✅ Conexión exitosa",
          description: "SELECT básico funcionó correctamente",
        });
        
      } catch (e: any) {
        console.error('❌ Error en SELECT:', e);
        setConnectionStatus('error');
        setErrorMessage(e.message);
        toast({
          title: "❌ Error de conexión",
          description: e.message,
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Error desconocido');
      toast({
        title: "❌ Error de conexión",
        description: error.message || "No se pudo conectar con Supabase",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // NUEVA FUNCIÓN: Test A/B comparando ambas URLs
  const testBothURLs = async () => {
    setIsTesting(true);
    setConnectionStatus('idle');
    setErrorMessage('');
    setDebugInfo(null);

    try {
      console.log('🧪 ===== INICIANDO TEST A/B DE URLs =====');
      
      // URL 1: Hardcodeada del client.ts
      const hardcodedURL = "https://rqgnhzdybntylbgudjdw.supabase.co";
      const hardcodedKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZ25oemR5Ym50eWxiZ3VkamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NDY0MzIsImV4cCI6MjA3MjAyMjQzMn0.VB5fu5tDdxtplwP1y1uR1sJLDWqSFi3LJvKxVMN1Cfk";
      
      // URL 2: Del .env
      const envURL = import.meta.env.VITE_SUPABASE_URL;
      const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('🔗 URL Hardcodeada:', hardcodedURL);
      console.log('🔗 URL del .env:', envURL);

      // Crear clientes temporales para cada URL
      const { createClient } = await import('@supabase/supabase-js');
      
      const clientHardcoded = createClient(hardcodedURL, hardcodedKey);
      const clientEnv = createClient(envURL, envKey);

      const results = {
        hardcoded: { url: hardcodedURL, tables: [], success: false },
        env: { url: envURL, tables: [], success: false }
      };

      // Test URL Hardcodeada
      console.log('🧪 Probando URL Hardcodeada...');
      try {
        const tables = ['temp_excel_import', 'survey_responses_indexed'];
        let accessibleTables = 0;
        
        for (const tableName of tables) {
          try {
            const { data, error, count } = await clientHardcoded
              .from(tableName)
              .select('*', { count: 'exact', head: true })
              .limit(1);
            
            if (!error) {
              const { count: totalCount } = await clientHardcoded
                .from(tableName)
                .select('*', { count: 'exact', head: true });
              
              results.hardcoded.tables.push({
                name: tableName,
                accessible: true,
                totalRecords: totalCount || 0
              });
              accessibleTables++;
            } else {
              results.hardcoded.tables.push({
                name: tableName,
                accessible: false,
                error: error.message
              });
            }
          } catch (e: any) {
            results.hardcoded.tables.push({
              name: tableName,
              accessible: false,
              error: e.message
            });
          }
        }
        
        results.hardcoded.success = accessibleTables > 0;
        console.log('✅ URL Hardcodeada:', accessibleTables > 0 ? 'ÉXITO' : 'FALLO');
        
      } catch (error: any) {
        console.error('❌ Error en URL Hardcodeada:', error.message);
        results.hardcoded.success = false;
      }

      // Test URL del .env
      console.log('🧪 Probando URL del .env...');
      try {
        const tables = ['temp_excel_import', 'survey_responses_indexed'];
        let accessibleTables = 0;
        
        for (const tableName of tables) {
          try {
            const { data, error, count } = await clientEnv
              .from(tableName)
              .select('*', { count: 'exact', head: true })
              .limit(1);
            
            if (!error) {
              const { count: totalCount } = await clientEnv
                .from(tableName)
                .select('*', { count: 'exact', head: true });
              
              results.env.tables.push({
                name: tableName,
                accessible: true,
                totalRecords: totalCount || 0
              });
              accessibleTables++;
            } else {
              results.env.tables.push({
                name: tableName,
                accessible: false,
                error: error.message
              });
            }
          } catch (e: any) {
            results.env.tables.push({
              name: tableName,
              accessible: false,
              error: e.message
            });
          }
        }
        
        results.env.success = accessibleTables > 0;
        console.log('✅ URL del .env:', accessibleTables > 0 ? 'ÉXITO' : 'FALLO');
        
      } catch (error: any) {
        console.error('❌ Error en URL del .env:', error.message);
        results.env.success = false;
      }

      // Mostrar resultados
      console.log('📊 ===== RESULTADOS DEL TEST A/B =====');
      console.log('🔗 URL Hardcodeada:', results.hardcoded.success ? '✅ FUNCIONA' : '❌ NO FUNCIONA');
      console.log('🔗 URL del .env:', results.env.success ? '✅ FUNCIONA' : '❌ NO FUNCIONA');
      
      // Determinar cuál es la correcta
      if (results.hardcoded.success && !results.env.success) {
        console.log('🎯 CONCLUSIÓN: La URL hardcodeada es la correcta');
        setConnectionStatus('success');
        setErrorMessage('La URL hardcodeada es la correcta. El .env tiene la URL incorrecta.');
      } else if (!results.hardcoded.success && results.env.success) {
        console.log('🎯 CONCLUSIÓN: La URL del .env es la correcta');
        setConnectionStatus('success');
        setErrorMessage('La URL del .env es la correcta. La hardcodeada no funciona.');
      } else if (results.hardcoded.success && results.env.success) {
        console.log('🎯 CONCLUSIÓN: Ambas URLs funcionan');
        setConnectionStatus('success');
        setErrorMessage('Ambas URLs funcionan. Revisar cuál tiene las tablas correctas.');
      } else {
        console.log('🎯 CONCLUSIÓN: Ninguna URL funciona');
        setConnectionStatus('error');
        setErrorMessage('Ninguna de las dos URLs funciona. Revisar configuración.');
      }

      // Guardar información de debug
      setDebugInfo({
        testResults: results,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "🧪 Test A/B completado",
        description: "Revisa la consola para ver los resultados detallados",
      });

    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Error en test A/B');
      toast({
        title: "❌ Error en test A/B",
        description: error.message || "No se pudo completar la comparación",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Sin probar</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {getStatusIcon()}
          <CardTitle className="text-lg">Prueba de Conexión Supabase</CardTitle>
        </div>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Verifica que la conexión con la base de datos esté funcionando correctamente
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={testConnection} 
              disabled={isTesting}
              className="w-auto"
              variant={connectionStatus === 'success' ? 'default' : 'outline'}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Probando...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Probar Conexión
                </>
              )}
            </Button>
            
            <Button 
              onClick={testBothURLs} 
              disabled={isTesting}
              className="w-auto"
              variant="outline"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test A/B...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test A/B URLs
                </>
              )}
            </Button>
            
            {debugInfo && (
              <Button
                onClick={() => setShowDebug(!showDebug)}
                variant="outline"
                size="sm"
              >
                <Bug className="h-4 w-4 mr-2" />
                {showDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
              </Button>
            )}
          </div>
        </div>

        {connectionStatus === 'error' && errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800 font-medium">Error:</p>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {connectionStatus === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">✅ Conexión exitosa</p>
              </div>
              <p className="text-sm text-green-700">
                La base de datos está accesible y funcionando correctamente
              </p>
            </div>
            
            {tableDetails.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-2">📊 Información de Tablas:</h4>
                <div className="space-y-2">
                  {tableDetails.map((table, index) => (
                    <div key={index} className="text-xs">
                      {table.accessible ? (
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 font-medium">{table.name}</span>
                          <span className="text-blue-600">✅ {table.totalRecords} registros</span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-red-700 font-medium">{table.name}</span>
                          <span className="text-red-600">❌ {table.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información de Debug Expandida */}
        {showDebug && debugInfo && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-800 flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-600" />
              Información de Debug
            </h4>
            
            {/* Información del Cliente */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-2">🔧 Información del Cliente</h5>
              <div className="text-sm space-y-1">
                <p><strong>URL:</strong> {debugInfo.clientInfo?.url}</p>
                <p><strong>API Key:</strong> {debugInfo.clientInfo?.key}</p>
                <p><strong>Headers:</strong> {debugInfo.clientInfo?.headers}</p>
              </div>
            </div>

            {/* Variables de Entorno */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-2">🌍 Variables de Entorno</h5>
              <div className="text-sm space-y-1">
                <p><strong>VITE_SUPABASE_URL:</strong> {debugInfo.envInfo?.VITE_SUPABASE_URL || 'No configurada'}</p>
                <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {debugInfo.envInfo?.VITE_SUPABASE_ANON_KEY}</p>
                <p><strong>NODE_ENV:</strong> {debugInfo.envInfo?.NODE_ENV}</p>
                <p><strong>MODE:</strong> {debugInfo.envInfo?.MODE}</p>
              </div>
            </div>

            {/* Resultados de Pruebas */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-800 mb-2">🧪 Resultados de Pruebas</h5>
              <div className="space-y-3">
                {debugInfo.tests?.map((test: any, index: number) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{test.name}</span>
                      <Badge variant={test.success ? "default" : "destructive"}>
                        {test.success ? "✅ Éxito" : "❌ Falló"}
                      </Badge>
                    </div>
                    {test.error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <strong>Error:</strong> {test.error}
                      </div>
                    )}
                    {test.data && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded mt-2">
                        <strong>Datos:</strong> {JSON.stringify(test.data)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center">
              Última ejecución: {debugInfo.timestamp}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>URL: {import.meta.env.VITE_SUPABASE_URL || 'No configurada'}</p>
          <p>Estado: {connectionStatus === 'idle' ? 'Pendiente' : connectionStatus === 'success' ? 'Activo' : 'Fallido'}</p>
        </div>

        {tableDetails.length > 0 && (
          <div className="mt-4">
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                🔍 Ver detalles de tablas
              </summary>
              <div className="mt-2 space-y-2 text-left">
                {tableDetails.map((table, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded border">
                    <div className="font-medium text-gray-800">{table.name}</div>
                    {table.accessible ? (
                      <div className="text-gray-600">
                        <div>✅ Accesible</div>
                        <div>📊 Total de registros: {table.totalRecords}</div>
                        {table.sampleData && table.sampleData.length > 0 && (
                          <div className="mt-1">
                            <div className="text-gray-500">Muestra de datos:</div>
                            <pre className="text-xs bg-white p-1 rounded border overflow-x-auto">
                              {JSON.stringify(table.sampleData[0], null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-600">
                        ❌ No accesible: {table.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Instrucciones de Debug */}
        {debugInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              ¿Qué hace este debug?
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Verifica la configuración del cliente Supabase</li>
              <li>• Prueba operaciones básicas (SELECT, INSERT, RPC)</li>
              <li>• Muestra variables de entorno disponibles</li>
              <li>• Identifica URLs duplicadas o mal configuradas</li>
              <li>• Ayuda a diagnosticar errores 404</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest;
