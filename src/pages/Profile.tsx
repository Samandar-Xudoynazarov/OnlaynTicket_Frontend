import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Hash, Calendar, Shield } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
}

const ROLE_LABELS: Record<string, string> = {
  user: "Foydalanuvchi",
  organizer: "Tashkilotchi",
  admin: "Administrator",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Profil</h1>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <CardTitle className="text-xl">{user.firstName} {user.lastName}</CardTitle>
                <Badge className="mt-1" variant="outline">
                  <Shield className="mr-1 h-3 w-3" />
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-slate-400">Ism va familya</p>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-slate-400">Telefon</p>
                  <p className="font-medium">{user.phone || "Ko'rsatilmagan"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-slate-400">User ID</p>
                  <p className="font-medium text-sm">{user.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-slate-400">Ro'yxatdan o'tgan sana</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/my-tickets")}>
                Mening chiptalarim
              </Button>
              {(user.role === "organizer" || user.role === "admin") && (
                <Button variant="outline" onClick={() => navigate("/organizer")}>
                  Organizer panel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}