import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import { FileText, Download } from 'lucide-react';

const mockReports = [
  { id: '1', name: 'Weekly Customer Engagement Summary', category: 'Attention Tracking', date: '2026-07-06' },
  { id: '2', name: 'Monthly Shelf Layout Performance Index', category: 'Layout Optimization', date: '2026-07-01' },
  { id: '3', name: 'Store Traffic & Dwell Time Analysis', category: 'Behavior Analytics', date: '2026-06-25' },
];

export function ReportsPage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleExport = (reportName: string) => {
    toast({
      title: 'Export initiated',
      description: `Downloading "${reportName}" as PDF...`,
      type: 'success',
    });
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Review structured attention mapping datasets, foot traffic indexes, and shelf engagement indices."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            Generated Intelligence Reports
          </CardTitle>
          <CardDescription>Platform-compiled analytics reports ready for operational review.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Compiled Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.category}</Badge>
                  </TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell className="text-right">
                    {user?.role === 'Retail Analyst' || user?.role === 'Administrator' || user?.role === 'Marketing Manager' ? (
                      <Button variant="outline" size="sm" onClick={() => handleExport(report.name)}>
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Read-only access</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
