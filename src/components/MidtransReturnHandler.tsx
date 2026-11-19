'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { StudioSubscription } from '@/types/difotoin';
import {
  activateVerifiedMidtransStudio,
  clearPendingMidtransDraft,
  readPendingMidtransDraft,
} from '@/utils/midtrans-client';

const STUDIO_SESSION_KEY = 'difotoin_active_studio_session_v1';

interface MidtransReturnHandlerProps {
  onActivated: (studio: StudioSubscription) => void;
}

export default function MidtransReturnHandler({
  onActivated,
}: MidtransReturnHandlerProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlOrderId = params.get('order_id');
    const isMayarReturn = params.get('mayar_return') === '1';
    const draft = readPendingMidtransDraft();
    if (!draft) return;
    if (urlOrderId && urlOrderId !== draft.orderId) return;

    let cancelled = false;
    async function verifyReturn() {
      if (!draft) return;
      setStatusMessage('Memverifikasi status pembayaran di server...');
      const res = await activateVerifiedMidtransStudio(draft);
      if (cancelled) return;
      if (res.ok && res.studio) {
        clearPendingMidtransDraft();
        window.localStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(res.studio));
        window.history.replaceState({}, '', '/studio/dashboard');
        setStatusMessage(null);
        onActivated(res.studio);
      } else {
        setStatusMessage(null);
      }
    }

    if (urlOrderId || isMayarReturn) void verifyReturn();
    return () => {
      cancelled = true;
    };
  }, [onActivated]);

  if (!statusMessage) return null;

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[140] glass-panel-strong border border-cyan-400/50 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
      <Loader2 className="w-4 h-4 text-cyan-300 animate-spin shrink-0" />
      <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
      <span className="font-jakarta text-xs font-semibold text-white">
        {statusMessage}
      </span>
    </div>
  );
}
