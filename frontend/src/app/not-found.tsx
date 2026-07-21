import Link from "next/link";
import Button from "@/app/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-app px-6 transition-colors">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-blue">
          404
        </p>
        <h1 className="mt-4 text-4xl font-bold text-text-primary">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-text-secondary">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </main>
  );
}
