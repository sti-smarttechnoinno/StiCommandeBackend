'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { reportsService, type GeneratedReport } from '@/services/reports';
import { useReportsStore } from '../store';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Printer,
  ClipboardList,
} from 'lucide-react';

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-3.5 w-3.5 text-rose-500" />,
  EXCEL: <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />,
  CSV: <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />,
  PRINT: <Printer className="h-3.5 w-3.5 text-muted-foreground" />,
};

export function RecentReportsTable() {
  const { refreshKey, searchQuery, selectedReportType, triggerRefresh } = useReportsStore();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reportsService.listReports({
        search: searchQuery,
        type: selectedReportType,
        page,
        pageSize: 6,
      });
      setReports(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      toast.error('Failed to fetch reports list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshKey, searchQuery, selectedReportType, page]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await reportsService.deleteReport(id);
      toast.success(`Deleted report "${name}"`);
      triggerRefresh();
    } catch {
      toast.error('Failed to delete report');
    }
  };

  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Generated Reports Log
          </CardTitle>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {total} total
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Report Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Created By</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Type</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Format</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Size</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    Loading reports data...
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    No generated reports found.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} className="border-border/20 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <span className="text-xs font-semibold text-foreground">{report.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-medium">{report.author}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-medium">{report.createdAt}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold capitalize bg-muted/40 border-border/60">
                        {report.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {FORMAT_ICONS[report.format] ?? <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{report.format}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-medium">{report.fileSize}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 pointer-events-none">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => toast.success(`Downloading ${report.name}...`)}>
                            <Download className="mr-2 h-3.5 w-3.5 text-blue-500" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(report.id, report.name)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 text-xs">
            <span className="text-muted-foreground font-medium">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 px-2.5 rounded-lg text-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2.5 rounded-lg text-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
