import { useEffect, useState } from "react";

import AnalyticsCards from "./AnalyticsCards";
import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsTable from "./AnalyticsTable";
import DashboardSummary from "./DashboardSummary";
import HeatmapCard from "./HeatmapCard";

import "../styles/AnalyticsDashboard.css";

import {
  getDashboardSummary,
  getLiveAnalytics,
  getAttentionTrend,
  getVisitorTrend,
  getEmotionDistribution,
  getGenderDistribution,
  getAgeGroupDistribution,
  getConsumerAnalytics,
  getHeatmap,
} from "../services/analyticsService";

function AnalyticsDashboard() {

  const [summary, setSummary] = useState({});

  const [liveData, setLiveData] = useState({});

  const [attentionTrend, setAttentionTrend] = useState([]);

  const [visitorTrend, setVisitorTrend] = useState([]);

  const [emotionData, setEmotionData] = useState([]);

  const [genderData, setGenderData] = useState([]);

  const [ageData, setAgeData] = useState([]);

  const [consumerData, setConsumerData] = useState([]);

  const [heatmapData, setHeatmapData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadDashboard = async () => {

    try {

      setLoading(true);

      setError("");

      const [

        summaryRes,

        liveRes,

        attentionRes,

        visitorRes,

        emotionRes,

        genderRes,

        ageRes,

        consumerRes,

        heatmapRes,

      ] = await Promise.all([

        getDashboardSummary(),

        getLiveAnalytics(),

        getAttentionTrend(),

        getVisitorTrend(),

        getEmotionDistribution(),

        getGenderDistribution(),

        getAgeGroupDistribution(),

        getConsumerAnalytics(),

        getHeatmap(),

      ]);

      setSummary(summaryRes);

      setLiveData(liveRes);

      setAttentionTrend(attentionRes);

      setVisitorTrend(visitorRes);

      setEmotionData(emotionRes);

      setGenderData(genderRes);

      setAgeData(ageRes);

      setConsumerData(consumerRes);

      setHeatmapData(heatmapRes);

    } catch (err) {

      console.error(err);

      setError("Unable to load analytics dashboard.");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadDashboard();

  }, []);

  if (loading) {

    return (

      <div className="analytics-dashboard">

        <h2>Loading Analytics Dashboard...</h2>

      </div>

    );

  }

  if (error) {

    return (

      <div className="analytics-dashboard">

        <h2>{error}</h2>

      </div>

    );

  }

  return (

    <div className="analytics-dashboard">

      <DashboardSummary
        summary={summary}
        liveData={liveData}
      />

      <AnalyticsCards
        summary={summary}
        liveData={liveData}
      />

      <AnalyticsCharts
        attentionTrend={attentionTrend}
        visitorTrend={visitorTrend}
        emotionData={emotionData}
        genderData={genderData}
        ageData={ageData}
      />

      <AnalyticsTable
        consumers={consumerData}
      />

      <HeatmapCard
        heatmap={heatmapData}
      />

    </div>

  );

}

export default AnalyticsDashboard;