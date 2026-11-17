'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createStudioSubscription,
  fetchAllStudioSubscriptions,
  generateLicenseCode,
} from '@/lib/supabase';
import { slugifyClientName } from '@/lib/drive-utils';
import { StudioSubscription } from '@/types/difotoin';
import { getQrisImageUrl, SUBSCRIPTION_PLANS } from '@/utils/pricing-plans';
import {
  markQrisProofAsUsed,
  validateQrisPaymentProof,
} from '@/utils/qris-validator';
import {
  fetchMidtransPaidStatus,
  requestMidtransTransaction,
} from '@/utils/midtrans-client';

const STUDIO_SESSION_KEY = 'difotoin_active_studio_session_v1';

interface UseQrisCheckoutOptions {
  isOpen: boolean;
  initialPlanId?: string;
  onClose: () => void;
  onSuccessLogin?: (studio: StudioSubscription) => void;
}

export function useQrisCheckout({
  isOpen,
  initialPlanId,
  onClose,
  onSuccessLogin,
}: UseQrisCheckoutOptions) {
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
  const [referenceId, setReferenceId] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [qrisSrc, setQrisSrc] = useState('/qris-bukafoto.svg');
  const [midtransOrderId, setMidtransOrderId] = useState<string | null>(null);
  const [midtransQrUrl, setMidtransQrUrl] = useState<string | null>(null);
  const [midtransExpiryTime, setMidtransExpiryTime] = useState<string | null>(null);
  const [midtransIsSandbox, setMidtransIsSandbox] = useState(false);
  const [midtransPendingReview, setMidtransPendingReview] = useState(false);
  const [midtransStatusText, setMidtransStatusText] = useState('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifiedPaid, setIsVerifiedPaid] = useState(false);
  const [activatedStudio, setActivatedStudio] =
    useState<StudioSubscription | null>(null);
  const activatingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setPlanId(initialPlanId || SUBSCRIPTION_PLANS[1].id);
    setQrisSrc(getQrisImageUrl());
    setMidtransOrderId(null);
    setMidtransQrUrl(null);
    setMidtransExpiryTime(null);
    setMidtransIsSandbox(false);
    setMidtransPendingReview(false);
    setMidtransStatusText('pending');
    setErrorMsg(null);
    setIsVerifiedPaid(false);
    setActivatedStudio(null);
    activatingRef.current = false;
  }, [isOpen, initialPlanId]);

  useEffect(() => {
    return () => {
      if (proofUrl) URL.revokeObjectURL(proofUrl);
    };
  }, [proofUrl]);

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
    () =>
      SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1],
    [planId]
  );

  const provisionPaidStudio = useCallback(async () => {
    if (activatingRef.current) return;
    activatingRef.current = true;
    setIsVerifiedPaid(true);
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
      activatingRef.current = false;
      setIsVerifiedPaid(false);
      setErrorMsg('Gagal membuat akun di server. Coba cek ulang.');
    }
  }, [studioSlug, studioName, ownerName, whatsapp, accessCode, selectedPlan]);

  const checkMidtransStatusOnce = useCallback(async () => {
    if (!midtransOrderId || activatingRef.current) return false;
    const data = await fetchMidtransPaidStatus(midtransOrderId);
    if (!data) return false;
    if (data.transactionStatus) setMidtransStatusText(data.transactionStatus);
    if (data.paid) {
      await provisionPaidStudio();
      return true;
    }
    return false;
  }, [midtransOrderId, provisionPaidStudio]);

  useEffect(() => {
    if (step !== 'payment' || !midtransOrderId || isVerifiedPaid) return;
    const interval = setInterval(() => void checkMidtransStatusOnce(), 3000);
    return () => clearInterval(interval);
  }, [step, midtransOrderId, isVerifiedPaid, checkMidtransStatusOnce]);

  async function handleGoToPayment(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const cleanSlug = slugifyClientName(studioSlug || studioName);
    if (!cleanSlug || cleanSlug.length < 3) {
      return setErrorMsg('Nama & slug studio minimal 3 karakter.');
    }
    if (cleanSlug === 'zeevisual') {
      return setErrorMsg('Slug "zeevisual" khusus Super Admin. Gunakan nama studio Anda.');
    }
    if (accessCode.trim().length < 4) {
      return setErrorMsg('Password / kode lisensi akses minimal 4 karakter.');
    }

    setIsChecking(true);
    try {
      const existing = await fetchAllStudioSubscriptions();
      if (existing.some((s) => s.studio_slug.toLowerCase() === cleanSlug)) {
        return setErrorMsg(`Slug "/${cleanSlug}" sudah dipakai. Tambahkan variasi nama.`);
      }
      setStudioSlug(cleanSlug);
      const txData = await requestMidtransTransaction({
        planId: selectedPlan.id,
        studioSlug: cleanSlug,
        ownerName: ownerName.trim() || studioName.trim(),
        whatsapp: whatsapp.trim(),
      });
      if (txData.configured && txData.orderId && txData.qrImageUrl) {
        setMidtransOrderId(txData.orderId);
        setMidtransQrUrl(txData.qrImageUrl);
        setMidtransExpiryTime(txData.expiryTime || null);
        setMidtransIsSandbox(Boolean(txData.isSandbox));
        setMidtransPendingReview(false);
        return setStep('payment');
      }
      if (txData.configured && txData.error) return setErrorMsg(txData.error);
      setMidtransOrderId(null);
      setMidtransQrUrl(null);
      setMidtransPendingReview(Boolean(txData.midtransPendingReview));
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
        file: fileToCheck,
        referenceId,
        payerName,
        expectedAmount: selectedPlan.price + uniqueCode,
      });
      if (!check.ok || !check.receiptHash) {
        return setErrorMsg(check.error || 'Bukti pembayaran QRIS belum valid.');
      }
      markQrisProofAsUsed(referenceId, check.receiptHash);
      await provisionPaidStudio();
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
    if (payerName.trim().length >= 3 && referenceId.trim().length >= 8) void verifyAndActivate(file);
  }

  async function handleActivateSubmit(e: React.FormEvent) { e.preventDefault(); await verifyAndActivate(proofFile); }

  return {
    step, setStep, planId, setPlanId, selectedPlan, studioName, setStudioName, studioSlug, setStudioSlug,
    ownerName, setOwnerName, whatsapp, setWhatsapp, accessCode, setAccessCode, uniqueCode,
    payerName, setPayerName, referenceId, setReferenceId, proofUrl, qrisSrc, midtransOrderId, midtransQrUrl,
    midtransExpiryTime, midtransIsSandbox, midtransPendingReview, midtransStatusText, errorMsg,
    isChecking, isVerifying, isVerifiedPaid, activatedStudio, handleGoToPayment,
    handleProofUpload, handleActivateSubmit, checkMidtransStatusOnce, handleOpenDashboard,
  };
}
