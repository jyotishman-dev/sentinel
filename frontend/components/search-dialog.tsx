"use client";

import { useState } from "react";
import { AlertTriangle, GitCommit, LayoutDashboard, Network, Search, Server, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectNav: (name: string) => void;
}

const SEARCH_OPTIONS = [
  { name: "Overview", desc: "Fleet health overview & summary metrics", icon: LayoutDashboard, cat: "Navigation" },
  { name: "Incidents", desc: "Incident command center & license to act", icon: AlertTriangle, cat: "Navigation" },
  { name: "Services", desc: "api-gateway, orders, auth container controls", icon: Server, cat: "Navigation" },
  { name: "Topology", desc: "Service mesh visual architecture graph", icon: Network, cat: "Navigation" },
  { name: "Deployments", desc: "Commit ledger & release rollbacks", icon: GitCommit, cat: "Navigation" },
  { name: "Chaos Lab", desc: "Inject fault simulations & latency spikes", icon: Zap, cat: "Navigation" },
];

export function SearchDialog({ open, onClose, onSelectNav }: SearchDialogProps) {
  const [query, setQuery] = useState("");

  if (!open) return null;

  const filtered = SEARCH_OPTIONS.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-[520px] max-w-[92vw] border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground mr-2.5" />
          <Input
            autoFocus
            placeholder="Search views, services, or actions..."
            className="border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent py-4 h-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="p-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onSelectNav(item.name);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/30 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono border-border">
                    {item.cat}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
