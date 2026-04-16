"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверный email или пароль");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
    } catch {
      setError("Произошла непредвиденная ошибка. Попробуйте снова.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F6F3] px-4 py-8">
      <Card className="w-full max-w-md border-[#EAEAEA] bg-white shadow-sm">
        <CardHeader className="pb-2 pt-8 text-center sm:pt-10">
          <CardTitle className="text-xl font-bold tracking-tight text-[#1a1a1a]">
            Вход в Geo Studio
          </CardTitle>
          <CardDescription className="mt-1.5 text-sm text-[#787774]">
            Введите свои данные для входа в систему
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pt-6 sm:px-10">
          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-[#DDDDD9] bg-white text-sm font-medium text-[#1a1a1a] hover:bg-[#F7F6F3]"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-5 w-5" />
            )}
            Продолжить с Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAEAEA]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#A3A3A0]">или</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-[#FDEBEC] border border-[#F5C2C7] p-3 text-sm text-[#B02A37]">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#1a1a1a]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ivan@example.com"
                required
                disabled={isLoading}
                className="h-11 border-[#DDDDD9] bg-white placeholder:text-[#B8B8B4]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#1a1a1a]">
                Пароль
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Ваш пароль"
                required
                disabled={isLoading}
                className="h-11 border-[#DDDDD9] bg-white placeholder:text-[#B8B8B4]"
              />
            </div>

            <Button
              type="submit"
              className="btn-tactile h-11 w-full rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Входим...
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pb-8 pt-4 sm:pb-10">
          <p className="w-full text-center text-sm text-[#787774]">
            Нет аккаунта?{" "}
            <Link href="/sign-up" className="font-medium text-[#1a1a1a] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
