"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { useAuth } from "@/app/components/auth/AuthContext";

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input label="Full name" placeholder="Jane Doe" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required disabled={isSubmitting} />
      <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required disabled={isSubmitting} />
      <Input label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required disabled={isSubmitting} />
      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {isSubmitting ? "Creating account..." : "Create healthcare workspace"}
      </Button>
      <p className="text-center text-sm font-medium text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-black text-primary-blue hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
