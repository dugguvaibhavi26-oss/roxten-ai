'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Instantly boot the OS - no fake loading screens.
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="h-screen w-full bg-[#FAFAFA]" />
  );
}
