import { GoogleLoginButton } from "@/features/auth/google-login-button";

import { BrandMark } from "./brand-mark";

function AccessDoorIllustration() {
  return (
    <svg className="access-door" viewBox="0 0 720 620" aria-hidden="true">
      <defs>
        <linearGradient id="door-front" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#0C4FAD" /><stop offset="1" stopColor="#1D388C" /></linearGradient>
        <linearGradient id="door-light" x1="0" x2="1"><stop stopColor="#FFFFFF" /><stop offset="1" stopColor="#FFD429" stopOpacity=".78" /></linearGradient>
        <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="22" stdDeviation="20" floodColor="#15346B" floodOpacity=".2" /></filter>
      </defs>
      <g className="circuit-lines" fill="none" stroke="#6EA4E3" strokeWidth="2.4" strokeLinecap="round">
        <path d="M18 105h142l48 48h107" /><path d="M58 164h90l62 62h112" /><path d="M2 244h170l42 42h105" /><path d="M4 348h153l67-67h79" />
        <path d="M414 88h135l42 42h108" /><path d="M430 173h111l46 46h121" /><path d="M442 266h105l33-33h126" /><path d="M429 350h129l53-53h96" /><path d="M412 428h131l45-45h118" />
      </g>
      <g fill="#FFD429"><circle cx="160" cy="105" r="8" /><circle cx="210" cy="226" r="7" /><circle cx="549" cy="88" r="8" /><circle cx="587" cy="219" r="7" /><circle cx="611" cy="383" r="8" /></g>
      <g fill="#FFFFFF" stroke="#9BC0ED" strokeWidth="2"><circle cx="172" cy="244" r="7" /><circle cx="157" cy="348" r="7" /><circle cx="541" cy="173" r="7" /><circle cx="547" cy="266" r="7" /></g>
      <g filter="url(#soft-shadow)">
        <path d="M282 171 486 126v362l-204-37Z" fill="url(#door-front)" /><path d="M232 196 282 171v280l-50 46Z" fill="#0B4594" /><path d="M255 218 282 205v232l-27 28Z" fill="url(#door-light)" /><path d="M282 171 486 126l-38 33-166 46Z" fill="#2671C9" />
        <rect x="434" y="292" width="18" height="66" rx="7" fill="#FFF5C7" /><rect x="439" y="297" width="8" height="55" rx="4" fill="#FFD429" />
      </g>
      <path d="m255 465-133 83h306l59-60-205-37Z" fill="#FFFFFF" fillOpacity=".72" /><path d="m255 465-81 83h137l-29-97Z" fill="#FFD429" fillOpacity=".15" />
    </svg>
  );
}

export function LoginHero() {
  return (
    <main className="login-page">
      <section className="login-shell">
        <BrandMark />
        <div className="login-hero-grid">
          <div className="login-copy">
            <p className="login-eyebrow">Sistem Rekod Akses Bilik ITU</p>
            <h1>Rekod masuk dan keluar, tanpa teka-teki.</h1>
            <p className="login-summary">Sistem rekod akses bilik ITU yang mudah, selamat dan teratur.</p>
            <div className="login-action"><GoogleLoginButton /></div>
            <p className="login-tagline">Masuk mudah, rekod teratur.</p>
          </div>
          <div className="login-visual"><AccessDoorIllustration /></div>
        </div>
      </section>
    </main>
  );
}
