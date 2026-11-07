import type { Metadata } from 'next';
import { Anton, Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import SpaceBackdrop from '@/components/SpaceBackdrop';
import FuturisticCursor from '@/components/FuturisticCursor';
import ZeevisualWatermark from '@/components/ZeevisualWatermark';

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DIFOTOIN — Futuristic Client Photo Proofing & Digital Album | Crafted by Zeevisual',
  description:
    'Platform pilih foto favorit klien & album digital futuristik minimalis untuk studio fotografi profesional. Crafted by Zeevisual.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${anton.variable} ${fraunces.variable} ${jakarta.variable}`}
    >
      <body className="futuristic-canvas text-slate-100 font-jakarta antialiased min-h-screen flex flex-col relative">
        <SpaceBackdrop />
        <FuturisticCursor />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
        <ZeevisualWatermark />
      </body>
    </html>
  );
}
