import { CheckIcon } from "./icons";

export interface ToastData {
  id: number;
  text: string;
}

export function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-24 left-1/2 z-[60] flex animate-toast items-center gap-2 rounded-full bg-ink/95 px-4 py-2 text-sm font-semibold text-paper shadow-xl sm:bottom-24"
    >
      <span className="grid h-5 w-5 place-items-center rounded-full bg-wa text-white">
        <CheckIcon className="h-3 w-3" />
      </span>
      {toast.text}
    </div>
  );
}
