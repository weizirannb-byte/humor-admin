import { voiceInfo } from "@/lib/voices";

/** Admin-area color for each voice (see the --voice-* tokens in globals.css). */
const COLORS: Record<string, string> = {
  midwest_nice: "var(--voice-1)",
  nyc_local: "var(--voice-2)",
  chronically_online: "var(--voice-3)",
};

export function voiceColor(key: string) {
  return COLORS[key] ?? "var(--muted)";
}

export function voiceLabel(key: string) {
  return voiceInfo(key).label;
}
