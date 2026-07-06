"use client";

import Image from "next/image";

interface Client {
  id: string;
  name: string;
  logoUrl: string;
}

interface ClientsFloatingGridProps {
  clients: Client[];
}

function ClientCard({ client }: { client: Client }) {
  return (
    <div className="float-card group relative w-36 h-20 sm:w-44 sm:h-24 flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4 rounded-xl bg-surface-raised border border-border transition-all duration-300 cursor-pointer">
      {client.logoUrl ? (
        <Image
          src={client.logoUrl}
          alt={client.name}
          fill
          className="object-contain p-2 sm:p-3 transition-transform duration-300 group-hover:scale-110"
          sizes="160px"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="text-text-muted text-xs sm:text-sm font-medium text-center">
          {client.name}
        </span>
      )}
    </div>
  );
}

export default function ClientsFloatingGrid({ clients }: ClientsFloatingGridProps) {
  if (clients.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-8">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6 justify-items-center">
        {clients.map((client, index) => {
          const col = index % 6;
          const isOddCol = col % 2 === 0;
          
          return (
            <div
              key={client.id}
              className={isOddCol ? "col-odd" : "col-even"}
            >
              <ClientCard client={client} />
            </div>
          );
        })}
      </div>
    </div>
  );
}