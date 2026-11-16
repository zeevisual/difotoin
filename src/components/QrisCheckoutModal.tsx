'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, X } from 'lucide-react';
import {
  createStudioSubscription,
  fetchAllStudioSubscriptions,
  generateLicenseCode,
} from '@/lib/supabase';
import { slugifyClientName } from '@/lib/drive-utils';
import { StudioSubscription } from '@/types/difotoin';
import { getQrisImageUrl, SUBSCRIPTION_PLANS } from '@/utils/pricing-plans';
import QrisStudioFormStep from '@/components/QrisStudioFormStep';
import { QrisActivatedStep, QrisPaymentStep } from '@/components/QrisPaymentSteps';

const STUDIO_SESSION_KEY = 'difotoin_active_studio_session_v1';

interface QrisCheckoutModalProps {
  isOpen: boolean;
  initialPlanId?: string;
  onClose: () => void;
  onSuccessLogin?: (studio: StudioSubscription) => void;
}

export default function QrisCheckoutModal({
  isOpen,
  initialPlanId,
  onClose,
  onSuccessLogin,
}: QrisCheckoutModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'payment' | 'activated'>('form');
  const [planId, setPlanId] = useState(initialPlanId || SUBSCRIPTION_PLANS[1].id);
  const [studioName, setStudioName] = useState('');
  const [studioSlug, setStudioSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [accessCode, setAccessCode] = useState(() => generateLicenseCode('BKFT'));
  const [uniqueCode, setUniqueCode] = useState(128);
  const [payerName, setPayerName] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [qrisSrc, setQrisSrc] = useState('/qris-bukafoto.svg');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activatedStudio, setActivatedStudio] = useState<StudioSubscription | null>(
    null
  );

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setPlanId(initialPlanId || SUBSCRIPTION_PLANS[1].id);
    setQrisSrc(getQrisImageUrl());
    setErrorMsg(null);
    setActivatedStudio(null);
  }, [isOpen, initialPlanId]);

  useEffect(() => {
    return () => {
      if (proofUrl) URL.revokeObjectURL(proofUrl);
    };
  }, [proofUrl]);

  const selectedPlan = useMemo(
    () =>
      SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1],
    [planId]
  );

  if (!isOpen) return null;

  async function handleGoToPayment(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const cleanSlug = slugifyClientName(studioSlug || studioName);
    if (!cleanSlug || cleanSlug.length < 3) {
      setErrorMsg('Nama & slug studio minimal 3 karakter.');
      return;
    }
    if (cleanSlug === 'zeevisual') {
      setErrorMsg('Slug "zeevisual" khusus Super Admin. Gunakan nama studio Anda.');
      return;
    }
    if (accessCode.trim().length < 4) {
      setErrorMsg('Password / kode lisensi akses minimal 4 karakter.');
      return;
    }

    setIsChecking(true);
    try {
      const existing = await fetchAllStudioSubscriptions();
      if (existing.some((s) => s.studio_slug.toLowerCase() === cleanSlug)) {
        setErrorMsg(`Slug "/${cleanSlug}" sudah dipakai. Tambahkan variasi nama.`);
        return;
      }
      setStudioSlug(cleanSlug);
      setUniqueCode(Math.floor(101 + Math.random() * 298));
      setStep('payment');
    } finally {
      setIsChecking(false);
    }
  }

  function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (proofUrl) URL.revokeObjectURL(proofUrl);
    setProofUrl(URL.createObjectURL(file));
  }

  async function handleActivateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!payerName.trim()) {
      setErrorMsg('Masukkan nama pengirim / rekening / e-wallet pembayaran.');
      return;
    }
    setErrorMsg(null);
    setIsActivating(true);
    try {
      const created = await createStudioSubscription({
        studio_slug: studioSlug,
        studio_name: studioName.trim(),
        owner_name: ownerName.trim() || studioName.trim(),
        whatsapp_number: whatsapp.trim(),
        access_code: accessCode.trim(),
        plan_name: selectedPlan.plan_name,
        max_galleries: selectedPlan.max_galleries,
        duration_days: selectedPlan.duration_days,
      });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(created));
      }
      setActivatedStudio(created);
      setStep('activated');
    } catch {
      setErrorMsg('Gagal mengaktifkan akun. Silakan coba lagi.');
    } finally {
      setIsActivating(false);
    }
  }

  function handleOpenDashboard() {
    if (activatedStudio && onSuccessLogin) {
      onSuccessLogin(activatedStudio);
      onClose();
      return;
    }
    onClose();
    router.push('/studio/dashboard');
  }

  return (
    <div
      className="fixed inset-0 z-[130] bg-[#02050A]/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl glass-panel-strong border border-cyan-400/35 rounded-2xl overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.85)] my-auto animate-fade-up"
      >
        <div className="bg-white/[0.04] border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-jakarta font-bold text-xs uppercase tracking-[0.16em]">
            <QrCode className="w-4 h-4" />
            <span>
              {step === 'form'
                ? '1. Data Studio & Paket'
                : step === 'payment'
                  ? '2. Scan Barcode QRIS & Bayar'
                  : '3. Akun Aktif Otomatis'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 font-jakarta text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {step === 'form' && (
            <QrisStudioFormStep
              planId={planId}
              selectedPlan={selectedPlan}
              onSelectPlan={setPlanId}
              studioName={studioName}
              onChangeStudioName={setStudioName}
              studioSlug={studioSlug}
              onChangeStudioSlug={setStudioSlug}
              ownerName={ownerName}
              onChangeOwnerName={setOwnerName}
              whatsapp={whatsapp}
              onChangeWhatsapp={setWhatsapp}
              accessCode={accessCode}
              onChangeAccessCode={setAccessCode}
              isChecking={isChecking}
              onSubmit={handleGoToPayment}
            />
          )}

          {step === 'payment' && (
            <QrisPaymentStep
              qrisSrc={qrisSrc}
              selectedPlan={selectedPlan}
              totalAmount={selectedPlan.price + uniqueCode}
              payerName={payerName}
              onChangePayerName={setPayerName}
              proofUrl={proofUrl}
              onProofUpload={handleProofUpload}
              isActivating={isActivating}
              onBack={() => setStep('form')}
              onSubmit={handleActivateAccount}
            />
          )}

          {step === 'activated' && activatedStudio && (
            <QrisActivatedStep
              studio={activatedStudio}
              onOpenDashboard={handleOpenDashboard}
            />
          )}
        </div>
      </div>
    </div>
  );
}
