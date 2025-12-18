"use client";

type GovernanceHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function GovernanceHeader({ title, description, children }: GovernanceHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-0.5">Governance</span>
            <span className="rounded-full border border-border px-2 py-0.5">Audit required</span>
          </div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="rounded-md border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          Classification: CONFIDENTIAL • Logged
        </div>
      </div>
      {children}
    </div>
  );
}
