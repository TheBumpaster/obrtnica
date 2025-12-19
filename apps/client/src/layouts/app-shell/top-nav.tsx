"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useIdentity } from '@/context/identity-context';

type TopNavProps = {
  onMenu: () => void;
  onLogout: () => void;
};

export function TopNav({ onMenu, onLogout }: TopNavProps) {
  const { tokens } = useAuth();
  const { activeWorkspace } = useIdentity();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const goCreate = (href: string) => {
    const query = search?.toString();
    const returnTo = query ? `${pathname}?${query}` : pathname;
    router.push(href + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''));
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8 lg:px-10">
      <div className="flex flex-1 items-center gap-3">
        <Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open menu" onClick={onMenu}>
          ☰
        </Button>
        <div className="flex items-center gap-2">
          <div className="text-base font-semibold text-foreground">OBRTNICA</div>
          {activeWorkspace ? (
            <Badge variant="outline" className="hidden md:inline-flex border-sidebar-border bg-sidebar text-foreground">
              {activeWorkspace.name}
            </Badge>
          ) : null}
        </div>
        <div className="hidden flex-1 items-center md:flex">
          <Input
            placeholder="Title name"
            className="h-9 max-w-sm rounded-[5px] border-input bg-card px-3 text-sm shadow-none"
            aria-label="Title search"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" aria-label="Notifications" title="Notifications">
          🔔
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              + Create New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card text-foreground">
            <DropdownMenuItem onClick={() => goCreate('/app/selling')}>Create Sales Invoice</DropdownMenuItem>
            <DropdownMenuItem onClick={() => goCreate('/app/buying')}>Create Purchase Invoice</DropdownMenuItem>
            <DropdownMenuItem onClick={() => goCreate('/app/stock')}>Create Item</DropdownMenuItem>
            <DropdownMenuItem onClick={() => goCreate('/app/projects')}>Create Project</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage alt="User avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">User</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card text-sm text-foreground">
            <div className="px-3 py-2">
              <div className="font-medium">Signed in</div>
              <div className="truncate text-xs text-muted-foreground">{tokens?.accessToken ? 'Session active' : 'Not set'}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => goCreate('/app/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
