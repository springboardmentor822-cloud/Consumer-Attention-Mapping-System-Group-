import { useEffect, useState } from "react";
import API from "../services/api";
import { useCamera } from "../context/CameraContext";
import CameraSelector from "../components/CameraSelector";
import { FaUsers, FaVideo, FaServer, FaBell, FaRobot, FaCheckCircle } from "react-icons/fa";

function Analytics() {
  const { selectedCamera } = useCamera();
  const [data,setData]=useState({
    current_persons:0,
    total_customers:0,
    attention_score:0,
    average_dwell:0,
    product_interactions:0,
    system_status:"Online",
    camera_status:"Active",
    fps:0,
    last_updated:""
  });

  useEffect(()=>{
    const load=async()=>{
      try{
        const {data}=await API.get(`/analytics/live/${selectedCamera}`);
        setData(prev=>({...prev,...data}));
      }catch(e){console.error(e);}
    };
    load();
    const t=setInterval(load,2000);
    return ()=>clearInterval(t);
  },[selectedCamera]);

  const alerts=[
    {type:"info",msg:`Current customers: ${data.current_persons}`},
    {type:"success",msg:`System Status: ${data.system_status}`},
    {type:"info",msg:`Camera: ${data.camera_status}`},
  ];

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1>📊 Analytics Dashboard</h1>
          <p>Real-time operational analytics (chart-free view)</p>
        </div>
        <CameraSelector/>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><FaUsers/><h2>{data.current_persons}</h2><span>Current Customers</span></div>
        <div className="kpi-card"><FaUsers/><h2>{data.total_customers}</h2><span>Total Customers</span></div>
        <div className="kpi-card"><FaRobot/><h2>{data.attention_score}%</h2><span>Attention Score</span></div>
        <div className="kpi-card"><FaServer/><h2>{data.fps}</h2><span>FPS</span></div>
      </div>

      <div className="analytics-layout">
        <section className="panel">
          <h3><FaVideo/> Camera Status</h3>
          <table className="analytics-table">
            <thead><tr><th>Camera</th><th>Status</th><th>Last Update</th></tr></thead>
            <tbody>
              <tr>
                <td>{selectedCamera}</td>
                <td>{data.camera_status}</td>
                <td>{data.last_updated || "Live"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h3><FaCheckCircle/> System Health</h3>
          <ul>
            <li>Backend: Connected</li>
            <li>AI Engine: {data.system_status}</li>
            <li>Average Dwell: {data.average_dwell}s</li>
            <li>Product Interactions: {data.product_interactions}</li>
          </ul>
        </section>

        <section className="panel">
          <h3><FaBell/> AI Alerts</h3>
          {alerts.map((a,i)=><div key={i} className="alert-item">{a.msg}</div>)}
        </section>

        <section className="panel">
          <h3>Activity Timeline</h3>
          <div className="timeline">
            <div>🟢 Live monitoring active</div>
            <div>👥 {data.current_persons} customers detected</div>
            <div>🎯 Attention {data.attention_score}%</div>
            <div>🛒 {data.product_interactions} interactions</div>
          </div>
        </section>
      </div>
    </div>
  );
}
export default Analytics;