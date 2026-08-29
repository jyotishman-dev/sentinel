"use client";

import { useState } from "react";
import { X, ExternalLink, ShieldCheck, Terminal, Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AgentPanelProps {
  open: boolean;
  onClose: () => void;
  agentUrl?: string;
  widthVw?: number;
}

export function AgentPanel({
  open,
  onClose,
  widthVw = 46,
}: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<"agent" | "session">("agent");
  const [key, setKey] = useState(0);

  const agentLibraryUrl = "http://localhost:8790/agents/sentinel";
  const activeSessionUrl = "http://localhost:8790/sessions/01m16pm7c2c3pwcn1hfx37stra";
  const currentUrl = activeTab === "agent" ? agentLibraryUrl : activeSessionUrl;

  const reloadIframe = () => setKey((prev) => prev + 1);

  return (
    <div
      className="fixed bottom-0 right-0 top-14 z-[60] flex flex-col border-l border-border bg-[#0e1012] shadow-2xl transition-transform duration-300 ease-in-out font-mono"
      style={{
        width: `${widthVw}vw`,
        transform: open ? "translateX(0)" : "translateX(100%)",
      }}
    >
      {/* DRAWER HEADER */}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/70 bg-[#121417] px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
              TrueForge Agent Harness
            </span>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex items-center rounded-md bg-[#181a1d] p-0.5 border border-border/60 text-[10px]">
            <button
              onClick={() => setActiveTab("agent")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                activeTab === "agent"
                  ? "bg-theme-7-light/10 text-theme-7-light font-semibold border border-theme-7/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="h-3 w-3" />
              <span>Agent Library: sentinel</span>
            </button>

            <button
              onClick={() => setActiveTab("session")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                activeTab === "session"
                  ? "bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="h-3 w-3" />
              <span>Active Session</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={reloadIframe}
            title="Reload TrueForge session"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Open in new window"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
            title="Close drawer"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* EMBEDDED TRUEFORGE FRAME */}
      <div className="relative flex-1 bg-[#090a0b]">
        {open && (
          <iframe
            key={key}
            src={currentUrl}
            title="TrueForge Agent Harness"
            className="absolute inset-0 h-full w-full border-0"
            allow="clipboard-write"
          />
        )}
      </div>
    </div>
  );
}