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
  });
  const [loading, setLoading] = useState(true);

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
        setSettings(snapshot.data() as ClientsSectionSettings);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <section id="clients" className="py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{settings.title}</h2>
          <p className="text-text-muted">جاري التحميل...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="clients" className="py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">{settings.title}</h2>
        <p className="text-text-muted">{settings.subtitle}</p>
      </div>

      <ClientsFloatingGrid clients={clients} />
    </section>
  );
}