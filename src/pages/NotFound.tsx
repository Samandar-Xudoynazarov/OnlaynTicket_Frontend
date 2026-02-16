import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-8xl font-bold text-indigo-600">404</h1>
        <h2 className="text-2xl font-semibold text-slate-900">Sahifa topilmadi</h2>
        <p className="text-slate-500 max-w-md">
          Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.
        </p>
        <Button className="bg-indigo-600 hover:bg-indigo-700 mt-4" onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" /> Bosh sahifaga qaytish
        </Button>
      </div>
    </div>
  );
}