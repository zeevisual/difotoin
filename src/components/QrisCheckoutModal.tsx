'use client';

import React from 'react';
import { QrCode, X } from 'lucide-react';
import { StudioSubscription } from '@/types/difotoin';
import { useQrisCheckout } from '@/hooks/useQrisCheckout';
import QrisStudioFormStep from '@/components/QrisStudioFormStep';
import MidtransPaymentPanel from '@/components/MidtransPaymentPanel';
import QrisActivatedStep from '@/components/QrisActivatedStep';
import { QrisPaymentStep } from '@/components/QrisPaymentSteps';

interface QrisCheckoutModalProps {
  isOpen: boolean;
  initialPlanId?: string;
  renewStudio?: StudioSubscription | null;
  onClose: () => void;
  onSuccessLogin?: (studio: StudioSubscription) => void;
}

export default function QrisCheckoutModal({
  isOpen,
  initialPlanId,
  renewStudio = null,
  onClose,
  onSuccessLogin,
}: QrisCheckoutModalProps) {
  const c = useQrisCheckout({
    isOpen,
    initialPlanId,
    renewStudio,
    onClose,
    onSuccessLogin,
  });

  if (!isOpen) return null;

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
              {c.step === 'form'
                ? '1. Data Studio & Paket'
                : c.step === 'payment'
                  ? '2. Bayar QRIS & Verifikasi Otomatis'
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
          {c.errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 font-jakarta text-xs font-semibold">
              {c.errorMsg}
            </div>
          )}

          {c.step === 'form' && (
            <QrisStudioFormStep
              planId={c.planId}
              selectedPlan={c.selectedPlan}
              onSelectPlan={c.setPlanId}
              studioName={c.studioName}
              onChangeStudioName={c.setStudioName}
              studioSlug={c.studioSlug}
              onChangeStudioSlug={c.setStudioSlug}
              ownerName={c.ownerName}
              onChangeOwnerName={c.setOwnerName}
              whatsapp={c.whatsapp}
              onChangeWhatsapp={c.setWhatsapp}
              accessCode={c.accessCode}
              onChangeAccessCode={c.setAccessCode}
              isChecking={c.isChecking}
              isRenewal={c.isRenewal}
              onSubmit={c.handleGoToPayment}
            />
          )}

          {c.step === 'payment' &&
            ((c.midtransQrUrl || c.midtransPaymentUrl) && c.midtransOrderId ? (
              <MidtransPaymentPanel
                provider={c.midtransProvider}
                selectedPlan={c.selectedPlan}
                orderId={c.midtransOrderId}
                qrImageUrl={c.midtransQrUrl}
                paymentUrl={c.midtransPaymentUrl}
                expiryTime={c.midtransExpiryTime}
                isSandbox={c.midtransIsSandbox}
                statusText={c.midtransStatusText}
                isVerifiedPaid={c.isVerifiedPaid}
                onRefreshStatus={() => void c.checkMidtransStatusOnce()}
                onBack={() => c.setStep('form')}
              />
            ) : (
              <>
                {c.midtransPendingReview && !c.isPlaceholderQris && (
                  <div className="mb-3 p-3 rounded-xl bg-amber-400/10 border border-amber-400/35 text-amber-200 font-jakarta text-[11px] leading-relaxed">
                    Aktivasi otomatis QRIS Midtrans sedang dalam peninjauan bisnis.
                    Scan barcode QRIS di bawah lalu kirim bukti transfer ke Admin.
                  </div>
                )}
                <QrisPaymentStep
                  qrisSrc={c.qrisSrc}
                  isPlaceholderQris={c.isPlaceholderQris}
                  adminConfirmWaUrl={c.adminConfirmWaUrl}
                  selectedPlan={c.selectedPlan}
                  totalAmount={c.selectedPlan.price + c.uniqueCode}
                  payerName={c.payerName}
                  onChangePayerName={c.setPayerName}
                  referenceId={c.referenceId}
                  onChangeReferenceId={c.setReferenceId}
                  proofUrl={c.proofUrl}
                  onProofUpload={c.handleProofUpload}
                  isVerifying={c.isVerifying}
                  isVerifiedPaid={c.isVerifiedPaid}
                  onBack={() => c.setStep('form')}
                  onSubmit={c.handleActivateSubmit}
                />
              </>
            ))}

          {c.step === 'activated' && c.activatedStudio && (
            <QrisActivatedStep
              studio={c.activatedStudio}
              onOpenDashboard={() => c.handleOpenDashboard(c.activatedStudio)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
