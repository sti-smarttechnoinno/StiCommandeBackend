'use client';

import { useState, useEffect, use } from 'react';
import { ProformaPreview } from '@/features/crm/components/proforma-preview';
import { crmQuotesService } from '@/services/crm-quotes';
import type { CrmQuote } from '@/types/crm-quotes';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = use(params);
  const [quote, setQuote] = useState<CrmQuote | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuote = () => {
    crmQuotesService
      .get(Number(id))
      .then((q) => {
        setQuote(q);
      })
      .catch(() => {
        toast.error('Impossible de charger le devis.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQuote();
  }, [id]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Chargement de la facture proforma...</span>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm font-semibold">
        <span>Devis introuvable ou supprimé.</span>
      </div>
    );
  }

  return <ProformaPreview quote={quote} onRefresh={fetchQuote} />;
}
