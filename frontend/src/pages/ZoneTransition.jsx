import { useState } from "react";

import CameraSelector from "../components/CameraSelector";
import ZoneSummary from "../components/ZoneSummary";
import ZoneFlowChart from "../components/ZoneFlowChart";
import TransitionMatrix from "../components/TransitionMatrix";
import PopularRoutes from "../components/PopularRoutes";
import ZoneInsights from "../components/ZoneInsights";

import "../styles/ZoneTransition.css";

export default function ZoneTransition() {

    const [cameraId, setCameraId] = useState(1);

    return (

        <div className="trajectory-page">

            {/* ================= HEADER ================= */}

            <div className="trajectory-header">

                <div>

                    <h1>Zone Transition Analytics</h1>

                    <p>
                        AI Powered Customer Zone Movement Analysis
                    </p>

                </div>

                <div className="trajectory-camera">

                    <label>Select Camera</label>

                    <CameraSelector
                        value={cameraId}
                        onChange={setCameraId}
                    />

                </div>

            </div>

            {/* ================= SUMMARY ================= */}

            <ZoneSummary cameraId={cameraId} />

            {/* ================= FLOW ================= */}

            <div className="zone-card">

                <ZoneFlowChart cameraId={cameraId} />

            </div>

            {/* ================= MATRIX + ROUTES ================= */}

            <div className="zone-grid">

                <div className="zone-card">

                    <TransitionMatrix cameraId={cameraId} />

                </div>

                <div className="zone-card">

                    <PopularRoutes cameraId={cameraId} />

                </div>

            </div>

            {/* ================= INSIGHTS ================= */}

            <div className="zone-card">

                <ZoneInsights cameraId={cameraId} />

            </div>

        </div>

    );

}