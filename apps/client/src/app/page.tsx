"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '../context/auth-context';

export default function Home() {
  const { tokens } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (tokens?.accessToken) {
      router.replace('/app');
    } else {
      router.replace('/login');
    }
  }, [tokens, router]);

  return null;
}
