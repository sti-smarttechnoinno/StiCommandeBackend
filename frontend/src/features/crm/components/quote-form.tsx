'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  FileText,
  Loader2,
  Building2,
  Calendar,
  Layers,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { crmQuotesService } from '@/services/crm-quotes';
import { crmOpportunitiesService } from '@/services/crm-pipeline';
import { clientsService, type ClientData } from '@/services/clients';
import { crmLeadsService } from '@/services/crm-pipeline';
import { productsService, type ProductData } from '@/services/products';
import type {
  CrmQuote,
  CreateQuoteParams,
  CreateQuoteItemParam,
} from '@/types/crm-quotes';
import type { CrmOpportunity, CrmLead } from '@/types/crm-pipeline';
import { useRouter } from 'next/navigation';

interface QuoteFormProps {
  quoteToEdit?: CrmQuote | null;
  defaultOpportunityId?: number;
  defaultClientId?: number;
  defaultLeadId?: number;
}

interface FormItem {
  product_id?: number;
  product_name: string;
  reference: string;
  unit_price: number;
  quantity: number;
  discount_percent: number;
}

export function QuoteForm({
  quoteToEdit,
  defaultOpportunityId,
  defaultClientId,
  defaultLeadId,
}: QuoteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Reference data
  const [clients, setClients] = useState<ClientData[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);

  // Target type
  const [targetType, setTargetType] = useState<'client' | 'lead'>('client');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [region, setRegion] = useState('Centre');
  const [wilaya, setWilaya] = useState('Alger');
  const [address, setAddress] = useState('');

  // Dates & Terms
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [paymentTerms, setPaymentTerms] = useState('Au comptant à la livraison');
  const [notes, setNotes] = useState('');

  // Items & Taxes
  const [items, setItems] = useState<FormItem[]>([
    {
      product_name: '',
      reference: '',
      unit_price: 0,
      quantity: 1,
      discount_percent: 0,
    },
  ]);
  const [taxPercent, setTaxPercent] = useState<number>(19);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(0);

  // Load datasets
  useEffect(() => {
    clientsService.list({ pageSize: 100 }).then((res) => {
      if (res?.data) setClients(res.data);
    }).catch(() => {});

    crmLeadsService.list({ per_page: 100, status: 'all' }).then((res) => {
      if (res?.data) setLeads(res.data);
    }).catch(() => {});

    crmOpportunitiesService.list({ per_page: 100 }).then((res) => {
      if (res?.data) setOpportunities(res.data);
    }).catch(() => {});

    productsService.list({ pageSize: 100 }).then((res) => {
      if (res?.data) setProducts(res.data);
    }).catch(() => {});
  }, []);

  // Initialize or set default values
  useEffect(() => {
    if (quoteToEdit) {
      if (quoteToEdit.client_id) {
        setTargetType('client');
        setSelectedClientId(quoteToEdit.client_id);
      } else if (quoteToEdit.lead_id) {
        setTargetType('lead');
        setSelectedLeadId(quoteToEdit.lead_id);
      }
      setSelectedOpportunityId(quoteToEdit.opportunity_id || null);
      setClientName(quoteToEdit.client_name);
      setClientPhone(quoteToEdit.client_phone || '');
      setClientEmail(quoteToEdit.client_email || '');
      setRegion(quoteToEdit.region);
      setWilaya(quoteToEdit.wilaya || '');
      setAddress(quoteToEdit.address || '');
      setIssueDate(quoteToEdit.issue_date);
      setValidUntil(quoteToEdit.valid_until || '');
      setPaymentTerms(quoteToEdit.payment_terms || '');
      setNotes(quoteToEdit.notes || '');
      setTaxPercent(quoteToEdit.tax_percent);
      setGlobalDiscountPercent(quoteToEdit.discount_percent);

      if (quoteToEdit.items && quoteToEdit.items.length > 0) {
        setItems(
          quoteToEdit.items.map((it) => ({
            product_id: it.product_id ? Number(it.product_id) : undefined,
            product_name: it.product_name,
            reference: it.reference || '',
            unit_price: it.unit_price,
            quantity: it.quantity,
            discount_percent: it.discount_percent || 0,
          }))
        );
      }
    } else {
      if (defaultOpportunityId) {
        setSelectedOpportunityId(defaultOpportunityId);
      }
      if (defaultLeadId) {
        setTargetType('lead');
        setSelectedLeadId(defaultLeadId);
      } else if (defaultClientId) {
        setTargetType('client');
        setSelectedClientId(defaultClientId);
      }
    }
  }, [quoteToEdit, defaultOpportunityId, defaultClientId, defaultLeadId]);

  // When Client is selected, auto-fill address/contact
  const handleClientSelect = (clientId: number) => {
    setSelectedClientId(clientId);
    const cl = clients.find((c) => Number(c.id) === clientId);
    if (cl) {
      setClientName(cl.name);
      setClientPhone(cl.phone || '');
      setClientEmail(cl.email || '');
      setRegion(cl.region || 'Centre');
      setWilaya(cl.wilaya || 'Alger');
      setAddress(cl.address || '');
    }
  };

  // When Lead is selected, auto-fill
  const handleLeadSelect = (leadId: number) => {
    setSelectedLeadId(leadId);
    const ld = leads.find((l) => l.id === leadId);
    if (ld) {
      setClientName(ld.company_name);
      setClientPhone(ld.phone || '');
      setClientEmail(ld.email || '');
      setRegion(ld.region || 'Centre');
      setWilaya(ld.wilaya || 'Alger');
      setAddress(ld.address || '');
    }
  };

  // When Opportunity is selected, auto-select client or lead
  const handleOpportunitySelect = (oppId: number) => {
    setSelectedOpportunityId(oppId);
    const opp = opportunities.find((o) => o.id === oppId);
    if (opp) {
      if (opp.client_id) {
        setTargetType('client');
        handleClientSelect(opp.client_id);
      } else if (opp.lead_id) {
        setTargetType('lead');
        handleLeadSelect(opp.lead_id);
      }
    }
  };

  // Product selection on item line
  const handleProductSelect = (index: number, productIdStr: string) => {
    const prod = products.find((p) => String(p.id) === String(productIdStr));
    if (!prod) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_id: Number(prod.id) || undefined,
        product_name: prod.name,
        reference: prod.code || '',
        unit_price: Number(prod.nominalPrice ?? prod.price) || 0,
      };
      return copy;
    });
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_name: '',
        reference: '',
        unit_price: 0,
        quantity: 1,
        discount_percent: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Le devis doit contenir au moins un article.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Computed Totals
  const subtotalHt = items.reduce((acc, it) => {
    const lineTotal = (it.unit_price || 0) * (it.quantity || 1);
    const disc = it.discount_percent ? (lineTotal * it.discount_percent) / 100 : 0;
    return acc + (lineTotal - disc);
  }, 0);

  const globalDiscountAmount = (subtotalHt * (globalDiscountPercent || 0)) / 100;
  const taxableBase = Math.max(0, subtotalHt - globalDiscountAmount);
  const taxAmount = (taxableBase * (taxPercent || 0)) / 100;
  const totalTtc = taxableBase + taxAmount;

  const formatDzd = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast.error('Veuillez sélectionner un destinataire (Client ou Prospect).');
      return;
    }

    const invalidItem = items.find((it) => !it.product_name.trim() || it.quantity <= 0);
    if (invalidItem) {
      toast.error('Chaque ligne de devis doit avoir une désignation et une quantité supérieure à 0.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateQuoteParams = {
        client_id: targetType === 'client' ? (selectedClientId ?? undefined) : undefined,
        lead_id: targetType === 'lead' ? (selectedLeadId ?? undefined) : undefined,
        opportunity_id: selectedOpportunityId ?? undefined,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || undefined,
        client_email: clientEmail.trim() || undefined,
        region,
        wilaya: wilaya || undefined,
        address: address.trim() || undefined,
        tax_percent: taxPercent,
        discount_percent: globalDiscountPercent,
        issue_date: issueDate,
        valid_until: validUntil || undefined,
        payment_terms: paymentTerms.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          reference: it.reference || undefined,
          unit_price: Number(it.unit_price),
          quantity: Number(it.quantity),
          discount_percent: Number(it.discount_percent) || 0,
        })),
      };

      if (quoteToEdit) {
        const res = await crmQuotesService.update(quoteToEdit.id, payload);
        toast.success('Devis mis à jour avec succès.');
        router.push(`/crm/quotes/${quoteToEdit.id}`);
      } else {
        const newQuote = await crmQuotesService.create(payload);
        toast.success(`Devis ${newQuote.quote_code} créé avec succès !`);
        router.push(`/crm/quotes/${newQuote.id}`);
      }

      window.dispatchEvent(new CustomEvent('sti-crm-quote-updated'));
      window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));
    } catch {
      toast.error('Erreur lors de l’enregistrement du devis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="rounded-xl h-8 px-3 text-xs gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Annuler & Retour</span>
        </Button>

        <Button
          type="submit"
          size="sm"
          disabled={loading}
          className="rounded-xl h-8 px-4 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{quoteToEdit ? 'Enregistrer les modifications' : 'Générer le devis proforma'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client / Prospect & Opportunity selection */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="rounded-2xl border-border/70 p-4 space-y-4 bg-card shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              Destinataire du Devis
            </h3>

            {/* Target type switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl border">
              <button
                type="button"
                onClick={() => {
                  setTargetType('client');
                  setSelectedLeadId(null);
                }}
                className={`text-xs py-1.5 rounded-lg font-semibold transition-colors ${
                  targetType === 'client'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Client existant
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType('lead');
                  setSelectedClientId(null);
                }}
                className={`text-xs py-1.5 rounded-lg font-semibold transition-colors ${
                  targetType === 'lead'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Prospect (Lead)
              </button>
            </div>

            {targetType === 'client' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Choisir le client *</label>
                <Select
                  value={selectedClientId ? String(selectedClientId) : ''}
                  onValueChange={(val) => handleClientSelect(Number(val))}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Rechercher un client..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 rounded-xl">
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                        {c.name} ({c.wilaya || c.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Choisir le prospect *</label>
                <Select
                  value={selectedLeadId ? String(selectedLeadId) : ''}
                  onValueChange={(val) => handleLeadSelect(Number(val))}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Rechercher un prospect..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 rounded-xl">
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)} className="text-xs">
                        {l.company_name} ({l.name} - {l.wilaya})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Opportunity link */}
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <label className="text-xs font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Lier à une Opportunité (Pipeline)
              </label>
              <Select
                value={selectedOpportunityId ? String(selectedOpportunityId) : 'none'}
                onValueChange={(val) => {
                  if (val === 'none') {
                    setSelectedOpportunityId(null);
                  } else {
                    handleOpportunitySelect(Number(val));
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Aucune opportunité liée" />
                </SelectTrigger>
                <SelectContent className="max-h-56 rounded-xl">
                  <SelectItem value="none" className="text-xs">
                    -- Aucune opportunité liée --
                  </SelectItem>
                  {opportunities.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)} className="text-xs">
                      {o.title} ({formatDzd(o.amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Nom affiché sur le devis</label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Région</label>
                  <Input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Wilaya</label>
                  <Input
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Adresse complète</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Adresse postale..."
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>
          </Card>

          {/* Dates & Conditions */}
          <Card className="rounded-2xl border-border/70 p-4 space-y-3 bg-card shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Conditions & Échéances
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Date d'émission</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Validité jusqu'au</label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Conditions de règlement</label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ex: Au comptant, Virement à 30 jours..."
                className="h-8 text-xs rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Notes & Remarques (affichées en bas de page)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions particulières de livraison, délais..."
                className="text-xs rounded-xl resize-none h-16"
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Line items and live calculation */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="rounded-2xl border-border/70 p-5 bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Articles & Produits ({items.length})
              </h3>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="rounded-xl h-8 text-xs font-semibold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter une ligne</span>
              </Button>
            </div>

            {/* Line items table */}
            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineTotal = (item.unit_price || 0) * (item.quantity || 1);
                const lineDisc = item.discount_percent ? (lineTotal * item.discount_percent) / 100 : 0;
                const finalLineTotal = lineTotal - lineDisc;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        Ligne #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      {/* Product Select / Name */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Produit du catalogue
                        </label>
                        <Select
                          value={item.product_id ? String(item.product_id) : ''}
                          onValueChange={(val) => {
                            if (val) handleProductSelect(idx, val);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg">
                            <SelectValue placeholder="Choisir un produit..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-56 rounded-xl">
                            {products.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                {p.name} ({p.code || 'REF'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Custom product name / description if needed */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Désignation
                        </label>
                        <Input
                          placeholder="Nom de l'article"
                          value={item.product_name}
                          onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                          className="h-8 text-xs rounded-lg"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Prix HT
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-xs rounded-lg font-mono text-right"
                          required
                        />
                      </div>

                      {/* Qty */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Quantité
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                          }
                          className="h-8 text-xs rounded-lg font-bold text-center"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-muted-foreground">Remise ligne (%) :</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount_percent}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              'discount_percent',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-6 w-16 text-[11px] rounded text-center"
                        />
                      </div>

                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground mr-1.5">Total HT :</span>
                        <strong className="text-foreground">{formatDzd(finalLineTotal)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals & Tax Calculation Card */}
            <div className="pt-4 border-t border-border/60 flex flex-col items-end space-y-2 text-xs">
              <div className="w-full sm:w-80 space-y-2.5">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Sous-total Brut HT :</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatDzd(subtotalHt)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span>Remise Globale :</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={globalDiscountPercent}
                      onChange={(e) => setGlobalDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="h-6 w-14 text-center text-xs rounded"
                    />
                    <span>%</span>
                  </div>
                  <span className="font-mono text-emerald-600 font-semibold">
                    - {formatDzd(globalDiscountAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span>Taux TVA :</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="h-6 w-14 text-center text-xs rounded"
                    />
                    <span>%</span>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {formatDzd(taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t-2 border-primary/40 text-base font-black text-foreground">
                  <span>TOTAL TTC :</span>
                  <span className="font-mono text-primary text-lg">{formatDzd(totalTtc)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
