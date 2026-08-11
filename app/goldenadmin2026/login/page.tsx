import { BrandLogo } from '@/components/brand-logo';
import { LoginForm } from '@/components/admin/login-form';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
      <BrandLogo compact />
      <div className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-white/5 p-8">
        <div className="mb-6 font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
          Admin Sign In
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
