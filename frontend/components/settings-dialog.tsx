"use client";

import { useState } from "react";
import { Bot, Check, Globe, RefreshCw, Server, Settings, Shield, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AGENT_URL } from "@/lib/api";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [pollInterval, setPollInterval] = useState("4000");
  const [agentUrl, setAgentUrl] = useState(AGENT_URL);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-[460px] max-w-[92vw] border-border bg-popover p-5 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Control Plane Configuration</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Polling Interval */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Fleet Telemetry Polling Rate (ms)
            </label>
            <Input
              value={pollInterval}
              onChange={(e) => setPollInterval(e.target.value)}
              className="bg-muted/30 border-border font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Interval at which Sentinel probes health endpoints and pulls metrics.
            </p>
          </div>

          {/* TrueForge Agent Endpoint */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              TrueForge Agent Session URL
            </label>
            <Input
              value={agentUrl}
              onChange={(e) => setAgentUrl(e.target.value)}
              className="bg-muted/30 border-border font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Address of the running TrueForge agent server harness (default: localhost:8790).
            </p>
          </div>

          {/* Model info */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-muted-foreground">Harness Engine:</span>
              <Badge variant="outline" className="border-primary/30 text-primary text-[9px] font-mono">
                TrueForge 1.0 (OSS)
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[10px] uppercase text-muted-foreground">Default Model:</span>
              <span className="font-mono text-[10px] text-foreground">qwen3-coder (OpenRouter)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="text-xs border-border" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs bg-primary text-primary-foreground font-medium" onClick={handleSave}>
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Saved
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
