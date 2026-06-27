'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { ConnectButton } from './ConnectButton';

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`topbar${scrolled ? ' scrolled' : ''}`}>
      <Link href="/" className="wordmark" aria-label="Aave Rep Voting — home">
        <span className="diamond" aria-hidden="true" />
        Aave Rep Voting
      </Link>
      <ConnectButton />
    </header>
  );
}
