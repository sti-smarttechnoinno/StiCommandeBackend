'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { clientsService, type ClientData } from '@/services/clients';
import { ordersService, type OrderData } from '@/services/orders';
import { ClientTypeBadge, ClientStatusBadge } from '@/features/clients/components/client-badges';
import { ClientObjectivesCard } from '@/features/clients/components/client-objectives-card';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShoppingCart,
  TrendingUp,
  Target,
  Calendar,
  Loader2,
  Building2,
  Clock,
  Pencil,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [clientOrders, setClientOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const clientRes = await clientsService.get(id);
        if (!active) return;
        setClient(clientRes);

        // Fetch client orders
        const ordersRes = await ordersService.list({ pageSize: 50 });
        if (!active) return;
        const filtered = ordersRes.data.filter(
          (o) => String(o.client_id) === String(id) || (o.client_name && clientRes.name && o.client_name.toLowerCase() === clientRes.name.toLowerCase())
        );
        setClientOrders(filtered);
      } catch {
        if (active) toast.error('Failed to load client profile');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-medium text-muted-foreground">Loading client profile...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Client Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested client profile could not be found.</p>
        <Link href="/clients">
          <Button variant="outline" size="sm" className="gap-2 rounded-full text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Clients
          </Button>
        </Link>
      </div>
    );
  }

  const objective = client.objective;
  const isObjectiveConfigured = Boolean(objective && objective.isConfigured && objective.targetRevenue > 0);
  const targetRevenue = Number(objective?.targetRevenue || 0);
  const achievedRevenue = Number(objective?.achievedRevenue || 0);
  const objectivePercent = Math.min(100, Math.round(objective?.revenuePercentage || 0));

  const avatarInitials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString()} DA`;
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Breadcrumb & Actions Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/clients" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  Clients
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/clients/${id}`} className="text-foreground text-xs font-semibold">
                  {client.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <Link href="/clients" title="Back to Clients">
              <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Client Profile & Financial Overview
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info(`Contacting ${client.phone}`)}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span>Call Client</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setEditOpen(true)}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg"
          >
            <Pencil className="h-3.5 w-3.5 text-primary-foreground" />
            <span>Edit Profile</span>
          </Button>
        </div>
      </div>

      {/* Main Profile Hero Card */}
      <Card className="border border-border/60 shadow-md rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-bold">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {client.name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                    {client.clientCode || `CL-2026-${id.padStart(6, '0')}`}
                  </span>
                  <ClientStatusBadge status={client.status} />
                  <ClientTypeBadge type={client.clientType} />
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground pt-0.5">
                  {client.email && (
                    <span className="flex items-center gap-1.5 text-foreground font-semibold">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      {client.email}
                    </span>
                  )}
                  {client.email && <span>•</span>}
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {client.phone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    {client.address || `${client.wilaya}, ${client.region}`}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
                  <Badge variant="outline" className="gap-1 font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                    <Globe className="h-3 w-3" /> {client.region} Region
                  </Badge>
                  <Badge variant="outline" className="gap-1 font-semibold border-amber-500/30 text-amber-600 bg-amber-500/10">
                    <MapPin className="h-3 w-3" /> {client.wilaya}
                  </Badge>
                  {client.delegateName && (
                    <Badge variant="outline" className="gap-1 font-semibold border-blue-500/30 text-blue-600 bg-blue-500/10">
                      <User className="h-3 w-3" /> Delegate: {client.delegateName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Objective Status Summary Badge */}
            <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 p-4 rounded-xl bg-muted/40 border border-border/50 w-full md:w-auto min-w-[220px]">
              <div className="text-left md:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Monthly Objective
                </span>
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 mt-0.5 justify-end">
                  <Target className="h-3.5 w-3.5 text-primary" /> {isObjectiveConfigured ? `${objectivePercent}% Achieved` : 'Not Set'}
                </span>
              </div>
              <div className="h-px bg-border/40 w-full hidden md:block" />
              <div className="text-left md:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Achieved Revenue
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(achievedRevenue)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance KPIs Grid (4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Monthly Target */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Target</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-foreground">
              {isObjectiveConfigured ? formatCurrency(targetRevenue) : 'Not configured'}
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              {isObjectiveConfigured ? (objective?.monthName || 'Current month target') : 'No sales target configured'}
            </span>
          </div>
        </Card>

        {/* KPI 2: Achieved Revenue */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Achieved Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(achievedRevenue)}
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              {isObjectiveConfigured ? `${objectivePercent}% of target achieved` : 'Current month turnover'}
            </span>
          </div>
        </Card>

        {/* KPI 3: Total Spent / Turnover */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-foreground">
              {formatCurrency(Number(client.totalSpent || 0))}
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">Total turnover in DZD</span>
          </div>
        </Card>

        {/* KPI 4: Total Orders */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Orders</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-foreground">{client.totalOrders || clientOrders.length}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">Placed order history</span>
          </div>
        </Card>
      </div>

      {/* Client Monthly Objectives & Performance Archive */}
      <ClientObjectivesCard clientId={id} clientName={client.name} />

      {/* Main Content Layout: Client Orders (8 cols) + Account Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Client Orders List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Client Orders History</CardTitle>
                    <CardDescription className="text-xs">
                      Recent purchases and orders placed by {client.name}.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary bg-primary/10">
                  {clientOrders.length} Orders
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {clientOrders.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">No Orders Placed Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    This client account has no order history recorded in the database yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-xs font-bold">Order Code</TableHead>
                        <TableHead className="text-xs font-bold">Date</TableHead>
                        <TableHead className="text-xs font-bold">Status</TableHead>
                        <TableHead className="text-xs font-bold">Payment</TableHead>
                        <TableHead className="text-xs font-bold text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            {order.order_code}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-xs text-foreground font-medium">{order.payment_method}</TableCell>
                          <TableCell className="text-xs font-bold text-right text-foreground">
                            {formatCurrency(Number(order.total_amount || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Account & Territory Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">Account & Territory Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-primary" /> Client Code:
                </span>
                <span className="font-mono font-bold text-foreground">{client.clientCode || `CL-2026-${id}`}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" /> Business Type:
                </span>
                <ClientTypeBadge type={client.clientType} />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" /> Region:
                </span>
                <span className="font-semibold text-foreground">{client.region}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilaya:
                </span>
                <span className="font-semibold text-foreground">{client.wilaya}</span>
              </div>

              {client.delegateName && (
                <div className="flex items-center justify-between pb-3 border-b border-border/30">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-purple-500" /> Commercial Delegate:
                  </span>
                  <span className="font-semibold text-foreground">{client.delegateName}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Account Created:
                </span>
                <span className="font-semibold text-foreground">
                  {new Date(client.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
