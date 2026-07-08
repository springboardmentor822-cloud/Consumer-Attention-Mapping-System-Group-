import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { ClipboardList, Shield } from 'lucide-react';

const mockLogs = [
  { id: '1', action: 'User login', user: 'admin@consumerattention.com', timestamp: '2026-07-08 11:32:04', ip: '127.0.0.1', status: 'Success' },
  { id: '2', action: 'Store Manager Registration', user: 'manager@gmail.com', timestamp: '2026-07-08 11:28:11', ip: '127.0.0.1', status: 'Success' },
  { id: '3', action: 'Add Camera stream', user: 'admin@consumerattention.com', timestamp: '2026-07-08 10:15:02', ip: '192.168.1.15', status: 'Success' },
  { id: '4', action: 'Update shelf layout configuration', user: 'manager@gmail.com', timestamp: '2026-07-08 09:44:30', ip: '192.168.1.20', status: 'Success' },
  { id: '5', action: 'Failed Login attempt', user: 'unknown@visitor.com', timestamp: '2026-07-08 08:02:11', ip: '203.111.42.5', status: 'Failed' },
];

export function AuditLogsPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Verify system logs, operator authentication actions, and database mutation commands."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-500" />
            Security Audit Trail
          </CardTitle>
          <CardDescription>Immutable record of platform modifications and administrator activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Action</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Access Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
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
