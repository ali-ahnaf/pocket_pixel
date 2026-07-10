'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { AppBar, BottomNavBar, DesktopSidebar } from '@/components';

const libraries = [
  'Next.js',
  'React',
  'TypeScript',
  'Tailwind CSS',
  'lucide-react',
  'Express',
  'TypeORM',
  'SQLite',
];

export default function AttributionsPage() {
  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen flex flex-col md:flex-row overflow-x-hidden">
      <AppBar />

      <DesktopSidebar />

      <main className="flex-1 flex flex-col w-full md:h-screen relative px-3 md:px-0 pb-24 md:pb-0 overflow-y-auto overflow-x-hidden">
        <div className="w-full p-margin-mobile md:p-8 flex flex-col gap-stack-md">

          <section className="flex items-center gap-3 bg-surface-container border-4 border-black p-4">
            <BookOpen className="text-primary" />
            <h1 className="font-headline-md text-primary">
              ATTRIBUTIONS
            </h1>
          </section>

          <section className="bg-surface-container border-4 border-black p-4 flex flex-col gap-3">
            <h2 className="font-label-caps text-outline uppercase border-b-4 border-black pb-2">
              Third-party Libraries
            </h2>

            {libraries.map((library) => (
              <div
                key={library}
                className="bg-surface border-4 border-black p-3"
              >
                {library}
              </div>
            ))}
          </section>

          <Link
            href="/settings"
            className="flex items-center gap-2 bg-primary text-on-primary border-4 border-black p-4 w-fit hover:opacity-90"
          >
            <ArrowLeft size={18} />
            Back to Settings
          </Link>

        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}