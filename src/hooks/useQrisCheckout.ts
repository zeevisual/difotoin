'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifiedPaid, setIsVerifiedPaid] = useState(false);
  const [activatedStudio, setActivatedStudio] =
    useState<StudioSubscription | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setPlanId(initialPlanId || SUBSCRIPTION_PLANS[1].id);
    setQrisSrc(getQrisImageUrl());
    setErrorMsg(null);
    setIsVerifiedPaid(false);
    setActivatedStudio(null);
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
        setErrorMsg(check.error || 'Bukti pembayaran QRIS belum valid.');
        return;
      }
      setIsVerifiedPaid(true);
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
      markQrisProofAsUsed(referenceId, check.receiptHash);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STUDIO_SESSION_KEY, JSON.stringify(created));
      }
      setActivatedStudio(created);
      setStep('activated');
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
    if (payerName.trim().length >= 3 && referenceId.trim().length >= 8) {
      void verifyAndActivate(file);
    }
  }

  async function handleActivateSubmit(e: React.FormEvent) {
    e.preventDefault();
    await verifyAndActivate(proofFile);
  }

  return {
    step,
    setStep,
    planId,
    setPlanId,
    selectedPlan,
    studioName,
    setStudioName,
    studioSlug,
    setStudioSlug,
    ownerName,
    setOwnerName,
    whatsapp,
    setWhatsapp,
    accessCode,
    setAccessCode,
    uniqueCode,
    payerName,
    setPayerName,
    referenceId,
    setReferenceId,
    proofUrl,
    qrisSrc,
    errorMsg,
    isChecking,
    isVerifying,
    isVerifiedPaid,
    activatedStudio,
    handleGoToPayment,
    handleProofUpload,
    handleActivateSubmit,
    handleOpenDashboard,
  };
}
