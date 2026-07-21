import AuthCard from "@/app/components/auth/AuthCard";
import RegisterForm from "@/app/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Start checking medication interactions in minutes."
    >
      <RegisterForm />
    </AuthCard>
  );
}
