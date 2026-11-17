import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { StudioSubscription } from '@/types/difotoin';
import {
  fetchMidtransTransactionStatus,
  findPricingPlan,
  getMidtransConfig,
  verifyCheckoutToken,
} from '@/utils/midtrans-server';

export const dynamic = 'force-dynamic';

const redeemedOrders = new Map<string, string>();

interface ActivateBody {
  orderId?: string;
  checkoutToken?: string;
  planId?: string;
  studioSlug?: string;
  studioName?: string;
  ownerName?: string;
  whatsapp?: string;
  accessCode?: string;
  mode?: 'signup' | 'renew';
}

export async function POST(request: NextRequest) {
  const cfg = getMidtransConfig();
  if (!cfg.serverKey) {
    return NextResponse.json({ ok: false, error: 'Midtrans belum terkonfigurasi.' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as ActivateBody;
    const orderId = String(body.orderId || '').trim();
    const checkoutToken = String(body.checkoutToken || '').trim();
    const studioSlug = String(body.studioSlug || '').trim().toLowerCase();
    const selectedPlan = findPricingPlan(body.planId);
    const mode = body.mode === 'renew' ? 'renew' : 'signup';

    if (!orderId || !studioSlug || studioSlug.length < 3 || studioSlug === 'zeevisual') {
      return NextResponse.json({ ok: false, error: 'Data studio atau Order ID tidak valid.' }, { status: 400 });
    }

    const tokenValid = verifyCheckoutToken(
      { orderId, planId: selectedPlan.id, studioSlug, amount: selectedPlan.price },
      checkoutToken,
      cfg.serverKey
    );
    if (!tokenValid) {
      return NextResponse.json({ ok: false, error: 'Tanda tangan checkout tidak sah.' }, { status: 403 });
    }

    const tx = await fetchMidtransTransactionStatus(orderId, cfg);
    if (!tx.paid || tx.grossAmount < selectedPlan.price) {
      return NextResponse.json(
        { ok: false, error: `Pembayaran belum lunas (${tx.transactionStatus}).` },
        { status: 402 }
      );
    }

    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database belum terkonfigurasi.' }, { status: 503 });
    }

    const { data: existing } = await supabase
      .from('studio_subscriptions')
      .select('*')
      .eq('studio_slug', studioSlug)
      .maybeSingle();

    const cleanCode = String(body.accessCode || '').trim();

    if (mode === 'renew') {
      if (!existing) {
        return NextResponse.json({ ok: false, error: 'Akun studio tidak ditemukan.' }, { status: 404 });
      }
      if (!cleanCode || existing.access_code?.toLowerCase() !== cleanCode.toLowerCase()) {
        return NextResponse.json({ ok: false, error: 'Kode lisensi studio tidak cocok.' }, { status: 403 });
      }
      if (redeemedOrders.get(orderId) === studioSlug) {
        return NextResponse.json({ ok: true, alreadyActivated: true, studio: existing });
      }
      const baseMs = existing.expires_at
        ? Math.max(Date.now(), new Date(existing.expires_at).getTime())
        : Date.now();
      const nextExpiry =
        selectedPlan.duration_days && selectedPlan.duration_days > 0
          ? new Date(baseMs + selectedPlan.duration_days * 86400 * 1000).toISOString()
          : null;

      const { data: updated, error: updateErr } = await supabase
        .from('studio_subscriptions')
        .update({
          plan_name: selectedPlan.plan_name,
          max_galleries: Math.max(Number(existing.max_galleries) || 0, selectedPlan.max_galleries),
          is_active: true,
          expires_at: nextExpiry,
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (updateErr || !updated) {
        return NextResponse.json({ ok: false, error: 'Gagal memperpanjang paket di database.' }, { status: 500 });
      }
      redeemedOrders.set(orderId, studioSlug);
      return NextResponse.json({ ok: true, studio: updated as StudioSubscription });
    }

    if (existing) {
      if (cleanCode && existing.access_code?.toLowerCase() === cleanCode.toLowerCase()) {
        redeemedOrders.set(orderId, studioSlug);
        return NextResponse.json({ ok: true, alreadyActivated: true, studio: existing as StudioSubscription });
      }
      return NextResponse.json({ ok: false, error: `Slug "/${studioSlug}" sudah terdaftar.` }, { status: 409 });
    }

    const expiresAt =
      selectedPlan.duration_days && selectedPlan.duration_days > 0
        ? new Date(Date.now() + selectedPlan.duration_days * 86400 * 1000).toISOString()
        : null;

    const newStudio: StudioSubscription = {
      id: crypto.randomUUID(),
      studio_slug: studioSlug,
      studio_name: String(body.studioName || studioSlug).trim(),
      owner_name: String(body.ownerName || body.studioName || studioSlug).trim(),
      whatsapp_number: String(body.whatsapp || '').trim(),
      access_code: cleanCode || `BKFT-${Math.floor(1000 + Math.random() * 9000)}`,
      plan_name: selectedPlan.plan_name,
      max_galleries: selectedPlan.max_galleries,
      is_active: true,
      is_super_admin: false,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('studio_subscriptions')
      .insert(newStudio)
      .select('*')
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json({ ok: false, error: 'Gagal menyimpan akun studio baru.' }, { status: 500 });
    }

    redeemedOrders.set(orderId, studioSlug);
    return NextResponse.json({ ok: true, studio: inserted as StudioSubscription });
  } catch {
    return NextResponse.json({ ok: false, error: 'Permintaan aktivasi gagal diproses.' }, { status: 400 });
  }
}
