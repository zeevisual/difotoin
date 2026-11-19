'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllStudioSubscriptions, generateLicenseCode } from '@/lib/supabase';
import { slugifyClientName } from '@/lib/drive-utils';
import { StudioSubscription } from '@/types/difotoin';
import { DEFAULT_QRIS_IMAGE_URL, getQrisImageUrl, SUBSCRIPTION_PLANS } from '@/utils/pricing-plans';
import { markQrisProofAsUsed, validateQrisPaymentProof } from '@/utils/qris-validator';
import {
  activateVerifiedMidtransStudio,
  buildAdminConfirmWaUrl,
  clearPendingMidtransDraft,
  fetchMidtransPaidStatus,
  INITIAL_MIDTRANS_SESSION,
  MidtransUiSession,
  requestMidtransTransaction,
  savePendingMidtransDraft,
} from '@/utils/midtrans-client';

const STUDIO_SESSION_KEY = 'difotoin_active_studio_session_v1';

interface UseQrisCheckoutOptions {
  isOpen: boolean;
  initialPlanId?: string;
  renewStudio?: StudioSubscription | null;
  onClose: () => void;
  onSuccessLogin?: (studio: StudioSubscription) => void;
}

export function useQrisCheckout({
  isOpen,
  initialPlanId,
  renewStudio = null,
  onClose,
  onSuccessLogin,
}: UseQrisCheckoutOptions) {
  const router = useRouter();
  const isRenewal = Boolean(renewStudio);
  const [step, setStep] = useState<'form' | 'payment' | 'activated'>('form');
  const [planId, setPlanId] = useState(initialPlanId || SUBSCRIPTION_PLANS[1].id);
  const [studioName, setStudioName] = useState('');
  const [studioSlug, setStudioSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [accessCode, setAccessCode] = useState(() => generateLicenseCode('BKFT'));
  const [uniqueCode, setUniqueCode] = useState(128);
  const [payerName, setPayerName] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [qrisSrc, setQrisSrc] = useState(DEFAULT_QRIS_IMAGE_URL);
  const [mt, setMt] = useState<MidtransUiSession>(INITIAL_MIDTRANS_SESSION);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifiedPaid, setIsVerifiedPaid] = useState(false);
  const [activatedStudio, setActivatedStudio] = useState<StudioSubscription | null>(null);
  const activatingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setPlanId(initialPlanId || SUBSCRIPTION_PLANS[1].id);
    setQrisSrc(getQrisImageUrl());
    setMt(INITIAL_MIDTRANS_SESSION);
    setErrorMsg(null);
    setIsVerifiedPaid(false);
    setActivatedStudio(null);
    activatingRef.current = false;
    if (renewStudio) {
      setStudioName(renewStudio.studio_name);
      setStudioSlug(renewStudio.studio_slug);
      setOwnerName(renewStudio.owner_name);
      setWhatsapp(renewStudio.whatsapp_number || '');
      setAccessCode(renewStudio.access_code);
    }
  }, [isOpen, initialPlanId, renewStudio]);

  useEffect(() => () => { if (proofUrl) URL.revokeObjectURL(proofUrl); }, [proofUrl]);

  const handleOpenDashboard = useCallback(
    (targetStudio: StudioSubscription | null = activatedStudio) => {
      if (targetStudio && onSuccessLogin) {
        onSuccessLogin(targetStudio);
        onClose();
        return;
      }
      onClose();
      router.push('/studio/dashboard');
    },
    [activatedStudio, onSuccessLogin, onClose, router]
  );

  useEffect(() => {
    if (step !== 'activated' || !activatedStudio) return;
    const timer = setTimeout(() => handleOpenDashboard(activatedStudio), 1500);
    return () => clearTimeout(timer);
  }, [step, activatedStudio, handleOpenDashboard]);

  const selectedPlan = useMemo(
    () => SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1],
    [planId]
  );

  const adminConfirmWaUrl = useMemo(
    () =>
      buildAdminConfirmWaUrl({
        isRenewal, studioName, studioSlug, ownerName, whatsapp,
        planTitle: selectedPlan.title, price: selectedPlan.price,
        accessCode, payerName, referenceId,
      }),
    [isRenewal, studioName, studioSlug, ownerName, whatsapp, selectedPlan, accessCode, payerName, referenceId]
  );

  const provisionPaidStudio = useCallback(
    async (orderIdOverride?: string, tokenOverride?: string) => {
      const orderId = orderIdOverride || mt.orderId;
      const checkoutToken = tokenOverride || mt.checkoutToken;
      if (!orderId || !checkoutToken || activatingRef.current) return;

      activatingRef.current = true;
      setIsVerifiedPaid(true);
      try {
        const res = await activateVerifiedMidtransStudio({
          provider: mt.provider, orderId, checkoutToken, planId: selectedPlan.id, studioSlug,
          studioName: studioName.trim(), ownerName: ownerName.trim() || studioName.trim(),
          whatsapp: whatsapp.trim(), accessCode: accessCode.trim(), mode: isRenewal ? 'renew' : 'signup',
        });
        if (!res.ok || !res.studio) throw new Error(res.error || 'Gagal verifikasi transaksi.');
        clearPendingMidtransDraft();
        if (typeof window !== 'undefined') window.localStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(res.studio));
        setActivatedStudio(res.studio);
        setStep('activated');
      } catch (err) {
        activatingRef.current = false;
        setIsVerifiedPaid(false);
        setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat akun di server.');
      }
    },
    [mt.provider, mt.orderId, mt.checkoutToken, selectedPlan.id, studioSlug, studioName, ownerName, whatsapp, accessCode, isRenewal]
  );

  const checkMidtransStatusOnce = useCallback(async () => {
    if (!mt.orderId || activatingRef.current) return false;
    const data = await fetchMidtransPaidStatus(mt.orderId, mt.provider);
    if (!data) return false;
    if (data.transactionStatus) setMt((prev) => ({ ...prev, statusText: data.transactionStatus! }));
    if (data.paid) {
      await provisionPaidStudio(mt.orderId, mt.checkoutToken || undefined);
      return true;
    }
    return false;
  }, [mt.orderId, mt.provider, mt.checkoutToken, provisionPaidStudio]);

  useEffect(() => {
    if (step !== 'payment' || !mt.orderId || isVerifiedPaid) return;
    const interval = setInterval(() => void checkMidtransStatusOnce(), 3000);
    return () => clearInterval(interval);
  }, [step, mt.orderId, isVerifiedPaid, checkMidtransStatusOnce]);

  async function handleGoToPayment(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const cleanSlug = slugifyClientName(studioSlug || studioName);
    if (!cleanSlug || cleanSlug.length < 3) return setErrorMsg('Nama & slug studio minimal 3 karakter.');
    if (cleanSlug === 'zeevisual') return setErrorMsg('Slug "zeevisual" khusus Super Admin.');
    if (accessCode.trim().length < 4) return setErrorMsg('Password / kode lisensi akses minimal 4 karakter.');

    setIsChecking(true);
    try {
      if (!isRenewal) {
        const existing = await fetchAllStudioSubscriptions();
        if (existing.some((s) => s.studio_slug.toLowerCase() === cleanSlug)) {
          return setErrorMsg(`Slug "/${cleanSlug}" sudah dipakai. Tambahkan variasi nama.`);
        }
      }
      setStudioSlug(cleanSlug);
      const tx = await requestMidtransTransaction({
        planId: selectedPlan.id, studioSlug: cleanSlug,
        ownerName: ownerName.trim() || studioName.trim(), whatsapp: whatsapp.trim(),
      });
      if (tx.configured && tx.orderId && tx.checkoutToken && (tx.qrImageUrl || tx.paymentUrl)) {
        const provider = tx.provider || 'midtrans';
        savePendingMidtransDraft({
          provider, orderId: tx.orderId, checkoutToken: tx.checkoutToken, planId: selectedPlan.id,
          studioSlug: cleanSlug, studioName: studioName.trim(),
          ownerName: ownerName.trim() || studioName.trim(), whatsapp: whatsapp.trim(),
          accessCode: accessCode.trim(), mode: isRenewal ? 'renew' : 'signup',
        });
        setMt({
          provider, orderId: tx.orderId, checkoutToken: tx.checkoutToken,
          qrUrl: tx.qrImageUrl || null, paymentUrl: tx.paymentUrl || null,
          expiryTime: tx.expiryTime || null, isSandbox: Boolean(tx.isSandbox),
          pendingReview: false, statusText: 'pending',
        });
        return setStep('payment');
      }
      if (tx.configured && tx.error) return setErrorMsg(tx.error);
      setMt({ ...INITIAL_MIDTRANS_SESSION, pendingReview: Boolean(tx.midtransPendingReview) });
      setUniqueCode(Math.floor(101 + Math.random() * 298));
      setStep('payment');
    } finally {
      setIsChecking(false);
    }
  }

  async function verifyAndActivate(fileToCheck: File | null) {
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      const check = await validateQrisPaymentProof({
        file: fileToCheck, referenceId, payerName, expectedAmount: selectedPlan.price + uniqueCode,
      });
      if (!check.ok || !check.receiptHash) return setErrorMsg(check.error || 'Bukti pembayaran belum valid.');
      markQrisProofAsUsed(referenceId, check.receiptHash);
      setIsVerifiedPaid(true);
      if (typeof window !== 'undefined') window.open(adminConfirmWaUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsVerifying(false);
    }
  }

  function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (proofUrl) URL.revokeObjectURL(proofUrl);
    setProofFile(file);
    setProofUrl(URL.createObjectURL(file));
  }

  async function handleActivateSubmit(e: React.FormEvent) { e.preventDefault(); await verifyAndActivate(proofFile); }

  return {
    step, setStep, planId, setPlanId, selectedPlan, studioName, setStudioName, studioSlug, setStudioSlug,
    ownerName, setOwnerName, whatsapp, setWhatsapp, accessCode, setAccessCode, uniqueCode, isRenewal,
    payerName, setPayerName, referenceId, setReferenceId, proofUrl, qrisSrc,
    isPlaceholderQris: qrisSrc === DEFAULT_QRIS_IMAGE_URL, adminConfirmWaUrl,
    midtransProvider: mt.provider, midtransOrderId: mt.orderId, midtransQrUrl: mt.qrUrl,
    midtransPaymentUrl: mt.paymentUrl, midtransExpiryTime: mt.expiryTime,
    midtransIsSandbox: mt.isSandbox, midtransPendingReview: mt.pendingReview, midtransStatusText: mt.statusText,
    errorMsg, isChecking, isVerifying, isVerifiedPaid, activatedStudio,
    handleGoToPayment, handleProofUpload, handleActivateSubmit, checkMidtransStatusOnce, handleOpenDashboard,
  };
}
