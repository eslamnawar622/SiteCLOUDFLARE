"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ClientsFloatingGrid from "./ClientsFloatingGrid";
import { ClientsSectionSettings } from "@/lib/firestore/clients";

interface Client {
  id: string;
  name: string;
  logoUrl: string;
}

export default function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<ClientsSectionSettings>({
    title: "عملاؤنا",
    subtitle: "نفتخر بثقة كبرى الشركات والعلامات التجارية في مصر والوطن العربي",
    label: "شركاؤنا",
    labelSize: 14,
    titleSize: 32,
  });
  const [loading, setLoading] = useState(true);
  // ⛔ منع عرض القيم الافتراضية القديمة قبل ما توصل الإعدادات الحقيقية
  const [headerReady, setHeaderReady] = useState(false);

  // Live Preview — العملاء
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "clients"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      setClients(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Live Preview — الإعدادات (العنوان والوصف)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "clientsSection"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ClientsSectionSettings;
        setSettings({
          title: data.title || "عملاؤنا",
          subtitle: data.subtitle || "",
          label: data.label || "شركاؤنا",
          labelSize: data.labelSize || 14,
          titleSize: data.titleSize || 32,
        });
      }
      setHeaderReady(true);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <section id="clients" className="py-20">
        <div className="text-center mb-12" style={{ visibility: "hidden" }}>
          <span className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full text-2xl">
            {settings.title}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section id="clients" className="py-20">
      <div
        className="text-center mb-12"
        style={{ visibility: headerReady ? "visible" : "hidden" }}
      >
        <p
          className="text-primary font-semibold mb-3 tracking-wide"
          style={{ fontSize: settings.labelSize || 14 }}
        >
          {settings.label || "شركاؤنا"}
        </p>
        <span
          className="inline-block bg-primary text-white font-bold px-6 py-2 rounded-full mb-4"
          style={{ fontSize: settings.titleSize || 32 }}
        >
          {settings.title}
        </span>
        {settings.subtitle && (
          <p className="text-text-muted mt-4">{settings.subtitle}</p>
        )}
      </div>

      <ClientsFloatingGrid clients={clients} />
    </section>
  );
}