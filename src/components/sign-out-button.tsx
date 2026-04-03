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
      className="w-full justify-start gap-2 text-[#787774] hover:bg-[#F7F6F3] hover:text-[#1a1a1a]"
    >
      <LogOut className="h-4 w-4" />
      Выйти
    </Button>
  );
}
