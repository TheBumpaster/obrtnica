"use client";

import { PageHeader } from '@/layouts/app-shell/page-header';

import { DashboardGrid } from './dashboard-grid';





const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales', label: 'Sales' },
  { id: 'buying', label: 'Buying' },
  { id: 'stock', label: 'Stock' },
  { id: 'finance', label: 'Finance' },
  { id: 'activity', label: 'Activity' },
];

export function DashboardScreen() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" tabs={tabs} />
      <DashboardGrid />
    </div>
  );
}
