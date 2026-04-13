"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при регистрации");
        setIsLoading(false);
        return;
      }

      // Автоматически входим после успешной регистрации
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Регистрация успешна, но не удалось войти. Попробуйте войти вручную.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Произошла непредвиденная ошибка. Попробуйте снова.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F6F3] px-4">
      <Card className="w-full max-w-sm border-[#EAEAEA] bg-white shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-bold tracking-tighter text-[#1a1a1a]">Создать аккаунт</CardTitle>
          <CardDescription className="text-sm text-[#787774]">
            Зарегистрируйтесь, чтобы начать отслеживать упоминания бренда
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-[#FDEBEC] border border-[#F5C2C7] p-3 text-sm text-[#B02A37]">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Иван Петров"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ivan@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Минимум 6 символов"
                minLength={6}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="btn-tactile w-full rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создаём аккаунт...
                </>
              ) : (
                "Зарегистрироваться"
              )}
            </Button>

            <p className="text-center text-xs leading-relaxed text-[#787774]">
              Регистрируясь, вы&nbsp;принимаете условия{" "}
              <Link href="/offer" className="text-[#1a1a1a] underline underline-offset-2 hover:text-[#333]">
                Публичной оферты
              </Link>{" "}
              и&nbsp;даёте согласие на&nbsp;обработку персональных данных
              в&nbsp;соответствии с{" "}
              <Link href="/privacy" className="text-[#1a1a1a] underline underline-offset-2 hover:text-[#333]">
                Политикой конфиденциальности
              </Link>.
            </p>

            <p className="text-center text-sm text-[#787774]">
              Уже есть аккаунт?{" "}
              <Link href="/sign-in" className="font-medium text-[#1a1a1a] hover:underline">
                Войти
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
