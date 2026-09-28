'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { FileText, Loader2 } from 'lucide-react';
import { QuoteForm } from '@/features/crm/components/quote-form';
import { crmQuotesService } from '@/services/crm-quotes';
import type { CrmQuote } from '@/types/crm-quotes';

function NewQuoteContent() {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const opportunityId = searchParams.get('opportunityId');
  const clientId = searchParams.get('clientId');
  const leadId = searchParams.get('leadId');

  const [quoteToEdit, setQuoteToEdit] = useState<CrmQuote | null>(null);
  const [loading, setLoading] = useState(!!quoteId);

  useEffect(() => {
    if (quoteId) {
      crmQuotesService
        .get(Number(quoteId))
        .then((q) => {
          setQuoteToEdit(q);
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, [quoteId]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Chargement des données du devis...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Breadcrumb */}
      <div className="space-y-1 pb-3 border-b border-border/40">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="text-xs">Tableau de bord</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/crm/quotes" className="text-xs">Devis & Proformas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-xs font-semibold text-foreground">
                {quoteToEdit ? `Modifier ${quoteToEdit.quote_code}` : 'Nouveau Devis'}
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </span>
          <span>{quoteToEdit ? `Modifier le Devis ${quoteToEdit.quote_code}` : 'Rédiger une Offre Commerciale (Proforma)'}</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Sélectionnez les articles, ajustez les prix et remises, et paramétrez les modalités de paiement.
        </p>
      </div>

      <QuoteForm
        quoteToEdit={quoteToEdit}
        defaultOpportunityId={opportunityId ? Number(opportunityId) : undefined}
        defaultClientId={clientId ? Number(clientId) : undefined}
        defaultLeadId={leadId ? Number(leadId) : undefined}
      />
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Chargement...</span>
        </div>
      }
    >
      <NewQuoteContent />
    </Suspense>
  );
}
