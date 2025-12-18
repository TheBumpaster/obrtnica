"use client";

import { ShellLayout } from '../../components/shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ShellLayout>{children}</ShellLayout>;
}
