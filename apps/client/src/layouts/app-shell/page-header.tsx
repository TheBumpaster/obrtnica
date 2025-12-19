"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = { id: string; label: string };

type PageHeaderProps = {
  title: string;
  tabs?: Tab[];
  inputPlaceholder?: string;
};

export function PageHeader({ title, tabs, inputPlaceholder }: PageHeaderProps) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = search?.get('tab') || tabs?.[0]?.id;

  const tabItems = useMemo(() => tabs ?? [], [tabs]);

  const setTab = (id: string) => {
    const params = new URLSearchParams(search?.toString() || '');
    params.set('tab', id);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        </div>
        {inputPlaceholder ? (
          <div className="w-full max-w-xs">
            <Input placeholder={inputPlaceholder} />
          </div>
        ) : null}
      </div>
      {tabItems.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setTab}>
          <TabsList className="h-auto gap-4 overflow-x-auto border-b border-border bg-transparent p-0 text-sm text-muted-foreground">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-none border-b-2 border-transparent px-2 pb-3 text-sm font-medium tracking-tight data-[state=active]:border-[#de7cf1] data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}
    </div>
  );
}
