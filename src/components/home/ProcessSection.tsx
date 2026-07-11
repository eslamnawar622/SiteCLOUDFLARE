"use client";

import { useEffect, useRef, useState } from "react";
import { getProcessSteps, getProcessSettings } from "@/lib/firestore/process";
import { ProcessStep, ProcessSettings, DEFAULT_PROCESS_SETTINGS } from "@/types/process";
import { PROCESS_ICONS } from "@/lib/processIcons";

export default function ProcessSection() {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [settings, setSettings] = useState<ProcessSettings>(DEFAULT_PROCESS_SETTINGS);

  // أنيميشن النسخة الأفقية (ديسكتوب)
  const [isVisible, setIsVisible] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);

  // أنيميشن النسخة الرأسية (موبايل)
  const [visibleCount, setVisibleCount] = useState(0);
  const mobileItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    Promise.all([getProcessSteps(), getProcessSettings()]).then(([stepsData, settingsData]) => {
      setSteps(stepsData);
      setSettings(settingsData);
    });
  }, []);

  useEffect(() => {
    const el = desktopRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [steps.length]);

  useEffect(() => {
    if (steps.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setVisibleCount((prev) => Math.max(prev, index + 1));
          }
        });
      },
      { threshold: 0.4 }
    );
    mobileItemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [steps.length]);

  if (steps.length === 0) return null;

  return (
    <section className="relative pt-20 pb-32 md:pb-36 px-6 md:px-12 overflow-hidden bg-surface">
      {settings.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${settings.backgroundImageUrl})`,
            opacity: settings.backgroundOpacity / 100,
          }}
        />
      )}

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary text-sm font-semibold mb-3 tracking-wide">
            {settings.sectionLabel}
          </p>
          <span className="inline-block bg-primary text-white text-2xl md:text-4xl font-bold px-6 py-2 rounded-full">
            {settings.sectionTitle}
          </span>
        </div>

        {/* ============ نسخة الموبايل: تايم لاين رأسي ============ */}
        <div className="md:hidden relative">
          <div className="absolute top-0 bottom-0 right-7 w-0.5 bg-border" />
          <div
            className="absolute top-0 right-7 w-0.5 bg-primary transition-all duration-700 ease-out"
            style={{
              height: steps.length > 0 ? `${(visibleCount / steps.length) * 100}%` : "0%",
            }}
          />

          <div className="space-y-8">
            {steps.map((step, index) => {
              const isItemVisible = index < visibleCount;
              const Icon = step.icon ? PROCESS_ICONS[step.icon] : null;

              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    mobileItemRefs.current[index] = el;
                  }}
                  data-index={index}
                  className={`relative flex items-start gap-4 transition-all duration-700 ease-out ${
                    isItemVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: isItemVisible ? `${index * 90}ms` : "0ms" }}
                >
                  <div
                    className={`relative z-10 w-14 h-14 shrink-0 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-500 ${
                      isItemVisible
                        ? "border-primary shadow-[0_4px_14px_rgba(56,90,220,0.25)] scale-100"
                        : "border-border scale-90"
                    }`}
                  >
                    {Icon ? (
                      <Icon
                        className={`w-6 h-6 transition-colors ${
                          isItemVisible ? "text-primary" : "text-text-secondary"
                        }`}
                      />
                    ) : (
                      <span
                        className={`font-bold transition-colors ${
                          isItemVisible ? "text-primary" : "text-text-secondary"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  <div className="bg-white border border-border rounded-2xl px-4 py-3.5 flex-1 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    <p className="font-semibold text-text-primary mb-1">{step.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                    {step.details && (
                      <p className="text-xs text-text-muted bg-surface-raised border border-border rounded-lg px-3 py-2 mt-2">
                        {step.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============ نسخة الديسكتوب: كروت أفقية ============ */}
        <div ref={desktopRef} className="hidden md:block relative">
          <div className="absolute top-9 right-[10%] left-[10%] h-0.5 bg-border overflow-hidden z-0">
            <div
              className="h-full bg-primary transition-all duration-[1400ms] ease-out"
              style={{ width: isVisible ? "100%" : "0%" }}
            />
          </div>

          <div className="flex gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon ? PROCESS_ICONS[step.icon] : null;
              return (
                <div
                  key={step.id}
                  className={`relative flex-1 text-center transition-all duration-700 ease-out ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: isVisible ? `${index * 130}ms` : "0ms" }}
                >
                  <div className="relative z-10 flex justify-center mb-4">
                    <div className="w-[72px] h-[72px] rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-[0_4px_14px_rgba(56,90,220,0.25)] hover:scale-110 hover:shadow-[0_6px_20px_rgba(56,90,220,0.4)] transition-all duration-300 cursor-default">
                      {Icon ? (
                        <Icon className="w-7 h-7 text-primary" />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-border rounded-2xl p-4 h-full shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300">
                    <p className="font-semibold text-text-primary mb-1.5">{step.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                    {step.details && (
                      <p className="text-xs text-text-muted bg-surface-raised border border-border rounded-lg px-3 py-2 mt-2">
                        {step.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}