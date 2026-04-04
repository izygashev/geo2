"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileFormProps {
  currentName: string;
  currentEmail: string;
}

export function ProfileForm({ currentName, currentEmail }: ProfileFormProps) {
  const router = useRouter();

  // Name form
  const [name, setName] = useState(currentName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === currentName) return;

    setNameSaving(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error ?? "Ошибка сохранения");
      } else {
        setNameSuccess(true);
        router.refresh();
        setTimeout(() => setNameSuccess(false), 2000);
      }
    } catch {
      setNameError("Ошибка сети");
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (newPassword.length < 6) {
      setPwdError("Минимум 6 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("Пароли не совпадают");
      return;
    }

    setPwdSaving(true);

    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.error ?? "Ошибка сохранения");
      } else {
        setPwdSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwdSuccess(false), 2000);
      }
    } catch {
      setPwdError("Ошибка сети");
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Name form */}
      <form onSubmit={handleNameSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#787774]">Имя</span>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-48 text-sm"
              disabled={nameSaving}
              maxLength={100}
            />
            <Button
              type="submit"
              disabled={nameSaving || name.trim() === currentName || !name.trim()}
              className="h-8 gap-1 rounded-md bg-[#111] px-3 text-xs font-medium text-white hover:bg-[#333]"
            >
              {nameSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : nameSuccess ? (
                <Check className="h-3 w-3" />
              ) : (
                "Сохранить"
              )}
            </Button>
          </div>
        </div>
        {nameError && (
          <p className="text-right text-xs text-[#B02A37]">{nameError}</p>
        )}
      </form>

      <div className="flex items-center justify-between">
        <span className="text-sm text-[#787774]">Email</span>
        <span className="text-sm text-[#1a1a1a]">{currentEmail}</span>
      </div>

      {/* Password form */}
      <div className="border-t border-[#EAEAEA] pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          Смена пароля
        </p>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#787774]">Текущий пароль</span>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-8 w-48 text-sm"
              disabled={pwdSaving}
              maxLength={128}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#787774]">Новый пароль</span>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-8 w-48 text-sm"
              disabled={pwdSaving}
              maxLength={128}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#787774]">Подтвердить</span>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-8 w-48 text-sm"
              disabled={pwdSaving}
              maxLength={128}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pwdSaving || !currentPassword || !newPassword || !confirmPassword}
              className="h-8 gap-1 rounded-md bg-[#111] px-3 text-xs font-medium text-white hover:bg-[#333]"
            >
              {pwdSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : pwdSuccess ? (
                <>
                  <Check className="h-3 w-3" />
                  Сохранено
                </>
              ) : (
                "Сменить пароль"
              )}
            </Button>
          </div>
          {pwdError && (
            <p className="text-right text-xs text-[#B02A37]">{pwdError}</p>
          )}
        </form>
      </div>
    </div>
  );
}
