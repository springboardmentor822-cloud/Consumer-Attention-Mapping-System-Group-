import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Megaphone, TrendingUp, DollarSign } from 'lucide-react';

export const CampaignsView: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getMarketingDashboard('STORE-812').then((res) => setData(res));
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading Campaigns Data...</div>;

  const { campaigns, promotion_lift } = data;

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Marketing Campaigns & Promotional Lift Analytics</h2>
          <p className="text-xs text-slate-400">Before vs After promotional revenue lift, incremental sales, and campaign tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Campaign Before vs After Revenue ($)</h3>
          </div>
          <div className="bi-card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaigns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="before_sales" name="Before Promo ($)" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="after_sales" name="After Promo ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Promotion Incremental Lift Waterfall</h3>
          </div>
          <div className="bi-card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={promotion_lift.waterfall_steps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="step" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
