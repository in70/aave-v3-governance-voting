import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';

import { Providers } from './providers';
import { TopBar } from '../components/TopBar';

const sans = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aave Rep Voting',
  description:
    'Vote on Aave governance proposals as a representative, validated on Avalanche by storage proofs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <Providers>
          <TopBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
