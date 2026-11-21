import React, { useState } from 'react';
import { Download, Share, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-lg border border-[#6D28D9]/30 bg-[#F6ECF9] text-[#5B21B6] hover:bg-[#EDE0F6] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-lg border border-[#E8D7E4] bg-white text-[#221329] hover:bg-[#F6ECF3] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
          }`}
        >
          <Share className="w-3.5 h-3.5 shrink-0 text-[#6D28D9]" />
          Install on iOS
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-guide-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A0D24]/60 backdrop-blur-xs p-4"
          >
            <div className="w-full max-w-sm rounded-xl bg-white border border-[#E8D7E4] p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#614B69]">iOS Safari Installation</p>
                  <h3
                    id="ios-install-guide-title"
                    className="font-display text-2xl font-bold text-[#221329] mt-0.5"
                  >
                    Install BoardSprint 10
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close installation instructions"
                  className="p-1.5 rounded-lg text-[#614B69] hover:text-[#221329] hover:bg-[#F6ECF3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ol className="space-y-2.5 text-sm text-[#614B69] list-decimal list-inside">
                <li>
                  Tap the <strong className="text-[#221329]">Share</strong> button in the Safari
                  toolbar.
                </li>
                <li>
                  Scroll down and tap{' '}
                  <strong className="text-[#221329]">Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong className="text-[#221329]">Add</strong> to launch BoardSprint 10 full
                  screen with offline schedule access.
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg enchanted-cta py-2 text-xs font-medium text-white transition-all cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-lg bg-[#9D174D] px-3.5 py-2 text-xs font-medium text-white shadow-lg border border-white/20"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Study schedule &amp; syllabus are cached locally.</span>
    </div>
  );
}
