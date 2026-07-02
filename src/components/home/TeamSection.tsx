import { getTeamMembers } from "@/lib/firestore/team";
import Image from "next/image";

export default async function TeamSection() {
  const team = await getTeamMembers();

  if (team.length === 0) return null;

  return (
    <section className="bg-white py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-stone-900">
            فريقنا
          </h2>
          <p className="text-stone-500 mt-2">
            نخبة من المهندسين والمصممين المحترفين
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {team.map((member) => (
            <div key={member.id} className="text-center group">
              <div className="relative aspect-square w-full max-w-[220px] mx-auto rounded-full overflow-hidden mb-4 ring-2 ring-stone-100">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="220px"
                />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">
                {member.name}
              </h3>
              <p className="text-amber-700 text-sm mb-2">{member.role}</p>
              {member.bio && (
                <p className="text-stone-500 text-sm leading-relaxed mb-3 px-4">
                  {member.bio}
                </p>
              )}
              {member.linkedin && (
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 hover:bg-amber-700 hover:text-white transition-colors text-stone-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}