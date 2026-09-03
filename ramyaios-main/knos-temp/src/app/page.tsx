"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const INTRO_COOLDOWN_MS = 2 * 60 * 1000;
const LAST_INTRO_KEY = "kalvix-last-launch-video";

export default function AppLaunchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const lastIntro = Number(localStorage.getItem(LAST_INTRO_KEY) || "0");
    const shouldPlayIntro = Date.now() - lastIntro >= INTRO_COOLDOWN_MS;

    if (!shouldPlayIntro) {
      return;
    }

    localStorage.setItem(LAST_INTRO_KEY, String(Date.now()));
    setShowIntro(true);
  }, []);

  useEffect(() => {
    if (!showIntro) {
      return;
    }

    videoRef.current?.play().catch(() => {
      setTimeout(() => setShowIntro(false), 1200);
    });
  }, [showIntro]);

  return (
    <main className="relative min-h-screen min-h-dvh overflow-hidden bg-black text-white">
      {showIntro && (
        <section className="absolute inset-0 z-20 bg-black">
          <video
            ref={videoRef}
            className="h-screen h-dvh w-screen object-cover"
            style={{ objectPosition: "42% center" }}
            autoPlay
            playsInline
            preload="auto"
            onEnded={() => setShowIntro(false)}
            onError={() => setShowIntro(false)}
          >
            <source src="/launching-video.mp4" type="video/mp4" />
          </video>
        </section>
      )}

      <section className="grid min-h-screen min-h-dvh place-items-center bg-[radial-gradient(circle_at_50%_22%,rgba(215,169,40,0.24),transparent_32%),linear-gradient(145deg,#050505_0%,#12110d_48%,#050505_100%)] px-6 py-8">
        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="Kalvix Nexus logo"
            className="h-[118px] w-[118px] rounded-lg border border-white/10 bg-[#111113]/70 object-contain p-3 shadow-[0_0_44px_rgba(215,169,40,0.18)]"
          />
          <p className="mb-2 mt-6 text-[13px] font-black tracking-[0.18em] text-[#ffd86b]">
            KALVIX NEXUS
          </p>
          <h1 className="mb-10 text-4xl font-black leading-none tracking-normal">
            POS System
          </h1>

          <nav className="grid w-full gap-3" aria-label="Account actions">
            <Link
              className="grid min-h-[58px] place-items-center rounded-lg border border-[#ffd86b]/60 bg-gradient-to-br from-[#b98612] to-[#ffd86b] font-black uppercase tracking-[0.12em] text-black shadow-[0_16px_38px_rgba(0,0,0,0.28)] active:scale-[0.98]"
              href="/signup"
            >
              Sign Up
            </Link>
            <Link
              className="grid min-h-[58px] place-items-center rounded-lg border border-white/10 bg-[#111113]/80 font-black uppercase tracking-[0.12em] text-white shadow-[0_16px_38px_rgba(0,0,0,0.28)] active:scale-[0.98]"
              href="/login"
            >
              Sign In
            </Link>
            <Link
              className="grid min-h-[58px] place-items-center rounded-lg border border-red-400/60 bg-black font-black uppercase tracking-[0.12em] text-red-300 shadow-[0_16px_38px_rgba(0,0,0,0.28)] active:scale-[0.98]"
              href="/admin-login"
            >
              Admin
            </Link>
          </nav>

          <p className="mt-8 text-[11px] font-black tracking-[0.18em] text-neutral-500">
            V1.0 Secure Cloud POS
          </p>
        </div>
      </section>
    </main>
  );
}
