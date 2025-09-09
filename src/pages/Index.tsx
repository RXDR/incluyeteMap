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
        
        <div className=" mb-8 mx-auto">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center">
              <Globe className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Geoportal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Visualización interactiva de datos geográficos con MapLibre GL
              </p>
              <Link to="/mapa">
                <Button className="w-full">
                  Acceder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

       

          
        </div>



      
      </div>
    </div>
  );
};

export default Index;