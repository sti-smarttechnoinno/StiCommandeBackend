'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Building2, Upload, Trash2 } from 'lucide-react';

export function CompanyForm() {
  const [companyName, setCompanyName] = useState('STI Distribution');
  const [description, setDescription] = useState('Telecommunications distribution company specializing in mobile credit, SIM cards, and devices across Algeria.');
  const [regNumber, setRegNumber] = useState('RC-2024-001');
  const [taxId, setTaxId] = useState('NIF-123456789');
  const [rcNumber, setRcNumber] = useState('RC-001-2024');
  const [email, setEmail] = useState('contact@sti.dz');
  const [phone, setPhone] = useState('+213 555 00 00 00');
  const [website, setWebsite] = useState('https://sti.dz');
  const [address, setAddress] = useState('123 Didouche Mourad');
  const [city, setCity] = useState('Setif');
  const [postalCode, setPostalCode] = useState('19000');

  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Company Information
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Manage your company profile and organization details</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Logo Upload */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-muted/40 p-2 flex items-center justify-center border border-border/60 shadow-xs relative overflow-hidden">
            <Image
              src="/assets/logo-sti.png"
              alt="STI Logo"
              width={64}
              height={64}
              className="object-contain w-full h-full"
            />
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg border-border/60 text-xs font-semibold" onClick={() => toast.info('Logo upload')}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Logo
            </Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => toast.info('Logo removed')}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company Name</label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Registration Number</label>
            <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tax ID (NIF)</label>
            <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">RC Number</label>
            <Input value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-20 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Website</label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">City</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Postal Code</label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="h-11 rounded-xl border-border/60" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
