import { GoogleLoginButton } from "@/features/auth/google-login-button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">ITU eAccess</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Rekod masuk dan keluar, tanpa teka-teki.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Log masuk dengan akaun Google untuk menggunakan sistem rekod keluar masuk ITU.</p>
        <div className="mt-8"><GoogleLoginButton /></div>
      </section>
    </main>
  );
}
