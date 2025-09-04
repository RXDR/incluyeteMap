import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, MapPin, BarChart3, ArrowRight } from "lucide-react";
import SupabaseConnectionTest from "@/components/SupabaseConnectionTest";
import DataManagement from "@/components/DataManagement";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sistema de Encuestas InclúyeTE
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Sistema de Visualización de Encuestas de Campo
          </p>
          <p className="text-lg text-gray-500">
            Interfaz moderna para análisis de datos sociodemográficos
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center">
              <Globe className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Geoportal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Visualización interactiva de datos geográficos con MapLibre GL
              </p>
              <Link to="/geoportal">
                <Button className="w-full">
                  Acceder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center">
              <MapPin className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Mapas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Mapas de calor y visualizaciones coropléticas avanzadas
              </p>
              <Button className="w-full" variant="outline" disabled>
                Próximamente
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Análisis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Herramientas de análisis estadístico y reportes
              </p>
              <Button className="w-full" variant="outline" disabled>
                Próximamente
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Características Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>MapLibre GL integrado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sistema de análisis de encuestas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Mapas de calor interactivos</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Modo 3D/2D</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Leyendas dinámicas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Datos de Colombia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <SupabaseConnectionTest />
        </div>

        <div className="mt-8">
          <DataManagement />
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="lg">
              Ir al Dashboard
            </Button>
          </Link>
          <Link to="/geoportal">
            <Button size="lg">
              Comenzar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;