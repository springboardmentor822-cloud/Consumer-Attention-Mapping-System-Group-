import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/client";
import NoAnalyticsNotice from "../../components/dashboard/NoAnalyticsNotice";
import { Route, User, Clock, MapPin, Footprints, Navigation } from "lucide-react";

export default function CustomerJourney() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/analytics/customer-journey");
        setData(res.data);
      } catch (e) {
        console.error("Failed to fetch customer journey", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const hasData = data && data.has_data !== false && data.journeys?.length > 0;

  return (
    <Layout title="Customer Journey Analytics">
      <div className="space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Route className="w-5 h-5 text-indigo-400" />
              Customer Spatial Journey & Pathways
            </h1>
            <p className="text-xs text-slate-400 mt-1">Reconstructed trajectory paths from ByteTrack persistent ID associations.</p>
          </div>
        </div>

        {loading && !data ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading Customer Journeys...</div>
        ) : !hasData ? (
          <NoAnalyticsNotice title="No Active Customer Journeys Tracked" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.journeys?.map((j, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{j.customer_id}</h3>
                      <div className="text-[10px] text-slate-400">Track ID: #{j.track_id}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {j.exit_time}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Distance</span>
                    <span className="text-xs font-bold text-white">{j.total_distance} px</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Avg Speed</span>
                    <span className="text-xs font-bold text-white">{j.average_speed} px/s</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Entry</span>
                    <span className="text-xs font-bold text-white">{j.entry_time}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    Visited Zones:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {j.visited_zones?.map((z, zIdx) => (
                      <span key={zIdx} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {z}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                    Timeline Events:
                  </h4>
                  <div className="space-y-2 border-l border-slate-800 ml-2 pl-3">
                    {j.journey_timeline?.map((ev, eIdx) => (
                      <div key={eIdx} className="text-xs">
                        <span className="font-bold text-white">{ev.time}</span> - <span className="text-slate-300">{ev.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
