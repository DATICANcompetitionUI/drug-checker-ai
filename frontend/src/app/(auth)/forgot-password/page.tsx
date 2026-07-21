"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import AuthCard from "@/app/components/auth/AuthCard";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Account recovery"
      subtitle="Password recovery UI is prepared for the product flow. The current backend exposes login, register, refresh, logout, and profile endpoints."
    >
      <div className="space-y-5">
        <Input label="Email address" type="email" placeholder="you@example.com" disabled />
        <div className="rounded-3xl border border-warning-orange/20 bg-warning-orange/10 p-4 text-sm font-semibold leading-6 text-text-secondary">
          <div className="mb-2 flex items-center gap-2 font-black text-warning-orange">
            <MailCheck className="h-5 w-5" />
            Recovery endpoint pending
          </div>
          Ask the backend team to expose password reset endpoints before enabling this workflow for users.
        </div>
        <Link href="/login" className="block">
          <Button fullWidth>Return to sign in</Button>
        </Link>
      </div>
    </AuthCard>
  );
}
