import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../components/ui/toast';
import { Settings, Save } from 'lucide-react';

export function SettingsPage(): JSX.Element {
  const { toast } = useToast();
  const [retentionDays, setRetentionDays] = React.useState('90');
  const [confidenceThreshold, setConfidenceThreshold] = React.useState('0.65');

  const handleSave = () => {
    toast({ title: 'Settings saved successfully', description: 'System configurations have been updated.', type: 'success' });
  };

  return (
    <div>
      <PageHeader
        title="System Settings"
        description="Configure retail analytics models, database retention periods, and background system defaults."
      />

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-500" />
              Platform Configuration
            </CardTitle>
            <CardDescription>Adjust the active configurations for the Consumer Attention Mapping System.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retention">Analytics Retention Policy (Days)</Label>
              <Input
                id="retention"
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Sets how long tracking metrics are stored in the PostgreSQL database before archival.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">AI Object Confidence Threshold</Label>
              <Input
                id="threshold"
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Adjust minimum confidence required by YOLO model for customer detection.</p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Configurations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
