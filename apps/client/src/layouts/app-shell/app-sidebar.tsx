"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIdentity } from '@/context/identity-context';
import { cn } from '@/lib/utils';

type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

const iconMap: Record<string, React.ReactNode> = {
  dashboard: '📊',
  accounting: '📒',
  buying: '🛒',
  selling: '🤝',
  pos: '💳',
  stock: '📦',
  assets: '🏦',
  projects: '📁',
  settings: '⚙️',
};

export function AppSidebar({ open, onClose, onLogout }: AppSidebarProps) {
  const pathname = usePathname();
  const { navigation } = useIdentity();

  const navItems = useMemo(() => navigation, [navigation]);

  const content = (
    <div className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="text-base font-semibold tracking-tight">OBRTNICA</div>
          <Badge variant="secondary" className="uppercase bg-sidebar-accent text-sidebar-foreground">
            ERP
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden text-xl leading-none">
          ✕
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="space-y-2 px-3 py-5">
          {navItems.map((node) => {
            const isActive = node.route
              ? node.route === '/app'
                ? pathname === '/app'
                : pathname?.startsWith(node.route)
              : false;
            return (
              <div key={node.id} className="space-y-1">
                <SidebarItem href={node.route} label={node.label} active={isActive} id={node.id} onSelect={onClose} />
                {node.children ? (
                  <div className="space-y-1 pl-4">
                    {node.children.map((child) => (
                      <SidebarItem
                        key={child.id}
                        href={child.route}
                        label={child.label}
                        active={!!child.route && pathname?.startsWith(child.route)}
                        disabled={child.disabled}
                        id={child.id}
                        onSelect={onClose}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="space-y-2 px-3 py-4">
        <SidebarItem
          href="/app/settings"
          label="Postavke Obrtnice"
          active={pathname?.startsWith('/app/settings')}
          id="settings"
          onSelect={onClose}
        />
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-transparent hover:text-destructive"
          onClick={() => {
            onClose();
            onLogout();
          }}
        >
          Odjavi se
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex">
      <div className="hidden lg:flex">{content}</div>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (!value) onClose();
        }}
      >
        <SheetContent side="left" className="w-72 p-0" hideClose>
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar Navigation</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SidebarItem({
  href,
  label,
  active,
  disabled,
  id,
  onSelect,
}: {
  href?: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  id: string;
  onSelect?: () => void;
}) {
  const icon = iconMap[id] ?? '•';
  const inner = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        active ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border' : 'hover:bg-muted',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <span className="text-lg">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block"
        prefetch={false}
        onClick={() => {
          onSelect?.();
        }}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
