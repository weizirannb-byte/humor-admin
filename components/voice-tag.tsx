import { voiceColor, voiceLabel } from "@/lib/voice-style";

/** Voice name with a colored dot: the color is never the only signal. */
export function VoiceTag({ voice }: { voice: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[var(--muted)]">
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: voiceColor(voice) }} />
      {voiceLabel(voice)}
    </span>
  );
}
