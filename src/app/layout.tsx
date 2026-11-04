import type { Metadata } from 'next';
import { Anton, Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

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
  title: 'DIFOTOIN — Client Photo Proofing & Digital Album Editorial',
  description:
    'Platform pilih foto favorit klien & album digital bergaya retro vintage 70s editorial untuk fotografer profesional.',
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
      <body className="bg-cream text-espresso font-jakarta antialiased min-h-screen flex flex-col retro-paper-grain">
        {children}
      </body>
    </html>
  );
}
