"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { getInstallGuidance, type InstallPlatform } from "./install-guidance";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectPlatform(): InstallPlatform {
  const agent = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(agent)) return "ios";
  if (agent.includes("android")) return "android";
  return "desktop";
}

const subscribePlatform = () => () => undefined;

export function InstallCard({ initialPlatform }: { initialPlatform?: InstallPlatform }) {
  const detectedPlatform = useSyncExternalStore<InstallPlatform>(subscribePlatform, detectPlatform, () => "desktop");
  const platform = initialPlatform ?? detectedPlatform;
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  return (
    <section className="install-card">
      <Image src="/icon-192.png" width={96} height={96} alt="Ikon ITU eAccess" priority />
      <p className="install-kicker">PWA • Percuma</p>
      <h1>Pasang ITU eAccess</h1>
      <p>ITU eAccess boleh dipasang terus daripada pelayar dan tidak memerlukan Play Store.</p>
      {installed ? <p className="install-success" role="status">Aplikasi sudah dipasang.</p> : null}
      {promptEvent ? <button type="button" className="install-button" onClick={install}>Pasang sekarang</button> : null}
      <div className="install-guidance">
        <strong>Cara manual</strong>
        <p>{getInstallGuidance(platform)}</p>
      </div>
      <Link href="/" className="install-home-link">Kembali ke ITU eAccess</Link>
    </section>
  );
}
