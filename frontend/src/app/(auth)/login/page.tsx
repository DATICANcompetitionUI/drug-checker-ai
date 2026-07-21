import AuthCard from "@/app/components/auth/AuthCard";
import LoginForm from "@/app/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to access your medication safety dashboard."
    >
      <LoginForm />
    </AuthCard>
  );
}
