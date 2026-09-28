'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  ShoppingCart,
  Send,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Building2,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { crmQuotesService } from '@/services/crm-quotes';
import type { CrmQuote, QuoteStatus } from '@/types/crm-quotes';
import { useRouter } from 'next/navigation';

interface ProformaPreviewProps {
  quote: CrmQuote;
  onRefresh?: () => void;
}

const STATUS_BADGES: Record<QuoteStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground border-border' },
  sent: { label: 'Envoyé au client', color: 'bg-sky-500/10 text-sky-600 border-sky-200/50' },
  accepted: { label: 'Accepté par le client', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50' },
  rejected: { label: 'Refusé', color: 'bg-rose-500/10 text-rose-600 border-rose-200/50' },
  converted: { label: 'Converti en Commande', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50 font-bold' },
  expired: { label: 'Expiré', color: 'bg-amber-500/10 text-amber-600 border-amber-200/50' },
};

export function ProformaPreview({ quote, onRefresh }: ProformaPreviewProps) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const formatDzd = (val?: number | null) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConvertToOrder = async () => {
    if (!confirm('Voulez-vous transformer ce devis en commande ferme ?')) return;

    setConverting(true);
    try {
      const res = await crmQuotesService.convertToOrder(quote.id);
      toast.success('Devis converti en commande avec succès ! 🎉');
      onRefresh?.();
      window.dispatchEvent(new CustomEvent('sti-crm-quote-updated'));
      window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));

      if (res.order?.id) {
        router.push(`/orders`);
      }
    } catch {
      toast.error('Erreur lors de la conversion du devis en commande.');
    } finally {
      setConverting(false);
    }
  };

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    setUpdatingStatus(true);
    try {
      await crmQuotesService.updateStatus(quote.id, newStatus);
      toast.success(`Statut mis à jour : ${STATUS_BADGES[newStatus]?.label || newStatus}`);
      onRefresh?.();
      window.dispatchEvent(new CustomEvent('sti-crm-quote-updated'));
      window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));
    } catch {
      toast.error('Erreur lors de la mise à jour du statut.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusCfg = STATUS_BADGES[quote.status] || STATUS_BADGES.draft;

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-border/70 rounded-2xl shadow-xs print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/crm/quotes')}
          className="rounded-xl h-8 px-3 text-xs gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Retour aux devis</span>
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status buttons */}
          {quote.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('sent')}
              disabled={updatingStatus}
              className="rounded-xl h-8 px-3 text-xs gap-1.5 text-sky-600 border-sky-300"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Marquer comme envoyé</span>
            </Button>
          )}

          {(quote.status === 'draft' || quote.status === 'sent') && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('accepted')}
                disabled={updatingStatus}
                className="rounded-xl h-8 px-3 text-xs gap-1.5 text-emerald-600 border-emerald-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Marquer accepté</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('rejected')}
                disabled={updatingStatus}
                className="rounded-xl h-8 px-3 text-xs gap-1.5 text-rose-600 border-rose-300"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Marquer refusé</span>
              </Button>
            </>
          )}

          {/* Convert to order CTA */}
          {quote.status !== 'converted' && quote.status !== 'rejected' && (
            <Button
              size="sm"
              onClick={handleConvertToOrder}
              disabled={converting}
              className="rounded-xl h-8 px-3.5 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {converting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" />
              )}
              <span>Convertir en commande</span>
            </Button>
          )}

          {quote.status === 'converted' && quote.converted_order_id && (
            <Badge variant="outline" className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 border-indigo-200">
              Commande créée : {quote.converted_order?.order_code || 'ORD'}
            </Badge>
          )}

          {/* Print button */}
          <Button
            size="sm"
            onClick={handlePrint}
            className="rounded-xl h-8 px-3 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimer / PDF</span>
          </Button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 Proforma layout) */}
      <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {/* Document Header */}
        <div className="flex justify-between items-start pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">STI COMMANDE</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Distribution & Solutions Commerciales</p>
            <div className="text-xs text-slate-600 space-y-0.5 mt-3">
              <p>Zone Industrielle, Alger, Algérie</p>
              <p>Tél : +213 (0) 23 00 00 00 • Email : contact@stisl.dz</p>
              <p className="text-[11px] text-slate-400 font-mono">RC : 16/00-0000000B • NIF : 000000000000000 • NIS : 000000000</p>
            </div>
          </div>

          <div className="text-right space-y-1.5">
            <h1 className="text-xl font-black text-indigo-700 tracking-wider">FACTURE PROFORMA</h1>
            <p className="font-mono text-sm font-bold text-slate-800">{quote.quote_code}</p>
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Reference Info Box */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          {/* Recipient */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-bold uppercase text-slate-400">Destinataire (Client / Établissement)</p>
            <p className="text-sm font-bold text-slate-900">{quote.client_name}</p>
            {quote.address && <p className="text-slate-600">{quote.address}</p>}
            <p className="text-slate-600">
              {quote.wilaya ? `${quote.wilaya}, ` : ''}{quote.region}
            </p>
            {quote.client_phone && <p className="text-slate-600 font-mono">Tél : {quote.client_phone}</p>}
            {quote.client_email && <p className="text-slate-600">Email : {quote.client_email}</p>}
          </div>

          {/* Dates & Reference */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <p className="text-[11px] font-bold uppercase text-slate-400">Références Commerciales</p>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Date d'émission :</span>
              <span className="font-semibold text-slate-800">{quote.issue_date}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Date de validité :</span>
              <span className="font-semibold text-slate-800">{quote.valid_until || '30 jours'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Commercial référent :</span>
              <span className="font-semibold text-slate-800">{quote.user?.name || 'Commercial STI'}</span>
            </div>
            {quote.opportunity && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Dossier / Affaire :</span>
                <span className="font-semibold text-indigo-600">{quote.opportunity.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[11px] font-bold">
                <th className="py-2.5 px-2">Réf</th>
                <th className="py-2.5 px-2">Désignation Produit</th>
                <th className="py-2.5 px-2 text-right">Prix Unit. HT</th>
                <th className="py-2.5 px-2 text-center">Qté</th>
                <th className="py-2.5 px-2 text-right">Remise</th>
                <th className="py-2.5 px-2 text-right">Montant HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.items && quote.items.length > 0 ? (
                quote.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-3 px-2 font-mono text-slate-500">{item.reference || '-'}</td>
                    <td className="py-3 px-2 font-semibold text-slate-900">{item.product_name}</td>
                    <td className="py-3 px-2 text-right font-mono">{formatDzd(item.unit_price)}</td>
                    <td className="py-3 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-slate-500">
                      {item.discount_percent && item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right font-bold font-mono text-slate-900">
                      {formatDzd(item.subtotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Aucun article dans ce devis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-4 pb-6 border-t border-slate-200">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total HT :</span>
              <span className="font-mono font-semibold">{formatDzd(quote.subtotal_ht)}</span>
            </div>

            {quote.discount_percent > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Remise globale ({quote.discount_percent}%) :</span>
                <span className="font-mono font-semibold">- {formatDzd(quote.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>TVA ({quote.tax_percent}%) :</span>
              <span className="font-mono font-semibold">{formatDzd(quote.tax_amount)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-900">
              <span>TOTAL TTC (DZD) :</span>
              <span className="font-mono text-base text-indigo-700">{formatDzd(quote.total_ttc)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes & Legal Mentions */}
        <div className="pt-6 border-t border-slate-200 text-xs text-slate-600 grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <div>
              <p className="font-bold text-slate-800">Conditions de règlement :</p>
              <p className="text-[11px] text-slate-500">{quote.payment_terms || 'Paiement à la livraison / Virement bancaire.'}</p>
            </div>
            {quote.notes && (
              <div>
                <p className="font-bold text-slate-800">Notes & Remarques :</p>
                <p className="text-[11px] text-slate-500 whitespace-pre-line">{quote.notes}</p>
              </div>
            )}
          </div>

          <div className="text-right flex flex-col justify-between items-end">
            <div>
              <p className="font-bold text-slate-800">Cachet & Signature de l'émetteur :</p>
              <div className="h-20 w-44 border border-dashed border-slate-300 rounded-xl mt-2 flex items-center justify-center text-[10px] text-slate-400">
                STI COMMANDE
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">Ce document tient lieu de proposition commerciale valable jusqu'à la date d'échéance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
