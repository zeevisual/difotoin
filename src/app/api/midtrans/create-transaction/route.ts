import { NextRequest, NextResponse } from 'next/server';
import { createMayarInvoice, getMayarConfig } from '@/utils/mayar-server';
import {
  findPricingPlan,
  getMidtransConfig,
  signCheckoutToken,
} from '@/utils/midtrans-server';

export const dynamic = 'force-dynamic';

interface MidtransChargeResponse {
  status_code?: string;
  status_message?: string;
  order_id?: string;
  qr_string?: string;
  expiry_time?: string;
  actions?: Array<{ name?: string; url?: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      planId?: string;
      studioSlug?: string;
      ownerName?: string;
      whatsapp?: string;
    };

    const selectedPlan = findPricingPlan(body.planId);
    const cleanSlug = String(body.studioSlug || 'studio').trim().toLowerCase();
    const mayarCfg = getMayarConfig();

    if (mayarCfg.apiKey) {
      const origin = (
        process.env.NEXT_PUBLIC_BASE_URL ||
        request.nextUrl.origin ||
        'https://bukafoto.my.id'
      ).replace(/\/$/, '');
      const invRes = await createMayarInvoice({
        cfg: mayarCfg,
        planId: selectedPlan.id,
        planTitle: selectedPlan.title,
        price: selectedPlan.price,
        studioSlug: cleanSlug,
        ownerName: body.ownerName || cleanSlug,
        whatsapp: body.whatsapp,
        redirectUrl: `${origin}/studio/dashboard?mayar_return=1`,
      });
      if (!invRes.ok) {
        return NextResponse.json({ configured: true, error: invRes.error }, { status: 502 });
      }
      const checkoutToken = signCheckoutToken(
        {
          provider: 'mayar',
          orderId: invRes.data.id,
          planId: selectedPlan.id,
          studioSlug: cleanSlug,
          amount: selectedPlan.price,
        },
        mayarCfg.apiKey
      );
      return NextResponse.json({
        configured: true,
        provider: 'mayar',
        orderId: invRes.data.id,
        checkoutToken,
        paymentUrl: invRes.data.link,
        expiryTime: invRes.data.expiredAt,
        amount: selectedPlan.price,
        isSandbox: mayarCfg.isSandbox,
      });
    }

    const cfg = getMidtransConfig();
    if (!cfg.serverKey) return NextResponse.json({ configured: false });

    const orderId = `BKFT-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
    const midtransRes = await fetch(`${cfg.baseUrl}/v2/charge`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: cfg.authHeader,
      },
      body: JSON.stringify({
        payment_type: 'qris',
        qris: { acquirer: 'gopay' },
        transaction_details: { order_id: orderId, gross_amount: selectedPlan.price },
        item_details: [
          {
            id: selectedPlan.id,
            price: selectedPlan.price,
            quantity: 1,
            name: `Bukafoto - ${selectedPlan.title}`.slice(0, 50),
          },
        ],
        customer_details: {
          first_name: (body.ownerName || body.studioSlug || 'Studio').slice(0, 50),
          email: 'studio@bukafoto.my.id',
          phone: (body.whatsapp || '089614114644').slice(0, 20),
        },
      }),
    });

    const data = (await midtransRes.json()) as MidtransChargeResponse;
    if (
      data.status_code === '402' ||
      data.status_code === '406' ||
      String(data.status_message || '').toLowerCase().includes('not activated')
    ) {
      return NextResponse.json({ configured: false, midtransPendingReview: true });
    }

    const qrAction =
      data.actions?.find((a) => a.name === 'generate-qr-code') ||
      data.actions?.find((a) => a.name === 'generate-qr-code-v2');

    if (data.status_code !== '201' || !qrAction?.url) {
      return NextResponse.json(
        { configured: true, error: data.status_message || 'Gagal membuat QRIS dinamis dari Midtrans.' },
        { status: 502 }
      );
    }

    const checkoutToken = signCheckoutToken(
      { orderId, planId: selectedPlan.id, studioSlug: cleanSlug, amount: selectedPlan.price },
      cfg.serverKey
    );

    return NextResponse.json({
      configured: true,
      provider: 'midtrans',
      orderId,
      checkoutToken,
      qrImageUrl: qrAction.url,
      qrString: data.qr_string,
      expiryTime: data.expiry_time,
      amount: selectedPlan.price,
      isSandbox: cfg.isSandbox,
    });
  } catch {
    return NextResponse.json(
      { configured: true, error: 'Gagal memproses permintaan pembayaran.' },
      { status: 500 }
    );
  }
}
