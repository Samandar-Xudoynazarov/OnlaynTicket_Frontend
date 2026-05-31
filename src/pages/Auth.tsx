import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname === "/register";
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const { t } = useTranslation();
  const [tab, setTab] = useState(isRegister ? "register" : "login");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Email va parolni kiriting");
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success("Muvaffaqiyatli kirdingiz!");
      navigate("/");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Kirish xatosi");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !regEmail || !regPassword) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    if (regPassword !== confirmPassword) {
      toast.error("Parollar mos kelmaydi");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setLoading(true);
    try {
      await register({ firstName, lastName, email: regEmail, phone, password: regPassword });
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      navigate("/");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Ro'yxatdan o'tish xatosi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center font-bold text-white mx-auto mb-2">
              OT
            </div>
            <CardTitle className="text-2xl">Onlayn Tikket</CardTitle>
            <CardDescription>Chipta sotib olish platformasiga xush kelibsiz</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("auth.loginBtn")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth.registerBtn")}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t("auth.email")}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t("auth.password")}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("auth.loggingIn")}</> : t("auth.loginBtn")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("auth.firstName")} *</Label>
                      <Input id="firstName" placeholder={t("auth.firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("auth.lastName")} *</Label>
                      <Input id="lastName" placeholder={t("auth.lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">{t("auth.email")} *</Label>
                    <Input id="reg-email" type="email" placeholder="email@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("auth.phone")}</Label>
                    <Input id="phone" placeholder="+998 90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">{t("auth.password")} *</Label>
                    <Input id="reg-password" type="password" placeholder="••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t("auth.password")} (confirm) *</Label>
                    <Input id="confirm-password" type="password" placeholder="••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("auth.registering")}</> : t("auth.registerBtn")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}