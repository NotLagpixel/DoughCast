import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

/**
 * Listens for `beforeinstallprompt` and shows a small toast inviting the user
 * to add DoughCast to their home screen. Dismissable; only shows once per
 * 7-day window per browser. iOS doesn't fire this event — those users get
 * the install via Safari's native Share → Add to Home Screen.
 */
export const InstallPrompt = () => {
  const [deferred, setDeferred] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      const dismissedAt = Number(localStorage.getItem("dc_install_dismissed_at") || 0);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < sevenDays) return;
      setDeferred(e);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Hide if already installed
  useEffect(() => {
    const onInstalled = () => setOpen(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const dismiss = () => {
    localStorage.setItem("dc_install_dismissed_at", String(Date.now()));
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") {
      setOpen(false);
    } else {
      dismiss();
    }
    setDeferred(null);
  };

  if (!open || !deferred) return null;

  return (
    <div
      data-testid="install-prompt"
      className="fixed bottom-24 md:bottom-5 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,420px)] rounded-2xl bg-white border border-[#EAE0D5] shadow-xl p-4 flex items-center gap-3"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAD4D0] text-[#C2493D]">
        <Download className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-semibold text-[#3E2723]">
          Install DoughCast
        </p>
        <p className="text-xs text-[#795548] truncate">
          Add it to your home screen for one-tap access.
        </p>
      </div>
      <button
        onClick={install}
        data-testid="install-prompt-accept"
        className="rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white text-xs font-semibold px-3.5 py-2"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        data-testid="install-prompt-dismiss"
        className="text-[#A1887F] hover:text-[#3E2723] p-1.5"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default InstallPrompt;
