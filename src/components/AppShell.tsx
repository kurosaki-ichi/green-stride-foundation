import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background pb-24">
      <div className="mx-auto max-w-md">
        {(title || right) && (
          <header className="flex items-start justify-between gap-4 px-5 pt-6 pb-3">
            <div>
              {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {right}
          </header>
        )}
        <main className="px-5">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
