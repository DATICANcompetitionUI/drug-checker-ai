"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { useAuth } from "@/app/components/auth/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
        disabled={isSubmitting}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-semibold text-text-secondary">Password</label>
          <Link href="/forgot-password" className="text-xs font-bold text-primary-blue hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          className="w-full rounded-2xl border border-border-app bg-white px-4 py-3 text-text-primary placeholder:text-text-muted transition focus:border-primary-blue disabled:cursor-not-allowed disabled:bg-surface-app"
        />
      </div>
      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {isSubmitting ? "Signing in..." : "Sign in securely"}
      </Button>
      <p className="text-center text-sm font-medium text-text-secondary">
        New to Drug Checker AI?{" "}
        <Link href="/register" className="font-black text-primary-blue hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
