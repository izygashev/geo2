"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full justify-start gap-2 text-slate-400 hover:bg-slate-800 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
      Выйти
    </Button>
  );
}
