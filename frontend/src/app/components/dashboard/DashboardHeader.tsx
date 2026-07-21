export default function DashboardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8 border-b border-border-app pb-7">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-primary-blue">Drug Checker AI</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-text-primary md:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-text-secondary">{description}</p>}
    </div>
  );
}
