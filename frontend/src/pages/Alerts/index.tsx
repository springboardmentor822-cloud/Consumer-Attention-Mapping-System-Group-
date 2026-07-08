import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../components/ui/toast';
import { Bell, CheckCircle2 } from 'lucide-react';

const initialAlerts = [
  { id: '1', store: 'Downtown Hypermarket', message: 'Entrance Camera offline', severity: 'Critical', time: '5 mins ago', status: 'Open' },
  { id: '2', store: 'Downtown Hypermarket', message: 'High congestion detected in Aisle 3', severity: 'Warning', time: '15 mins ago', status: 'Open' },
  { id: '3', store: 'Downtown Hypermarket', message: 'Shelf 2 layout tracking mismatch', severity: 'Info', time: '1 hour ago', status: 'Open' },
];

export function AlertsPage(): JSX.Element {
  const { toast } = useToast();
  const [alerts, setAlerts] = React.useState(initialAlerts);

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'Resolved' } : a)));
    toast({ title: 'Alert Acknowledged', type: 'success' });
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200';
      case 'Warning':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200';
      default:
        return 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-200';
    }
  };

  return (
    <div>
      <PageHeader
        title="Store Alerts"
        description="Monitor operational warnings, camera connectivity updates, and consumer traffic patterns."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-500" />
            Active Notifications
          </CardTitle>
          <CardDescription>Review open security and operational notices needing store management attention.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Notification Message</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Detected Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.store}</TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityBadge(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.time}</TableCell>
                  <TableCell className="text-right">
                    {alert.status === 'Open' ? (
                      <Button variant="outline" size="sm" onClick={() => handleAcknowledge(alert.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" />
                        Resolve
                      </Button>
                    ) : (
                      <Badge variant="secondary">Resolved</Badge>
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
