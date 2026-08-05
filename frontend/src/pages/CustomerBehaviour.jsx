import { useEffect, useState } from "react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Legend,
    Bar,
} from "recharts";

import { getCustomerBehaviour } from "../services/analyticsService";

import "../styles/CustomerBehaviour.css";

const COLORS = [
    "#3B82F6",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#A855F7",
];

export default function CustomerBehaviour() {

    const [cameraId] = useState(1);

    const [report, setReport] = useState(null);

    useEffect(() => {

        console.log("Loading Customer Behaviour...");

        loadData();

    },[]);

    async function loadData(){

        try{

            const res = await getCustomerBehaviour(cameraId);
            console.log("API Response:", res);

            setReport(res);

        }

        catch(err){

            console.error("Customer Behaviour Error:", err);

        }

    }

    if(!report){

        return(
            <div className="behaviour-loading">
                Loading...
            </div>
        )

    }

    const behaviourChart =
        Object.entries(report.behaviour_distribution || {})
        .map(([name,value])=>({
            name,
            value
        }));

    return(

<div className="behaviour-page">

<div className="behaviour-header">

<div>

<h1>Customer Behaviour Analytics</h1>

<p>
AI powered customer behaviour monitoring
</p>

</div>

</div>

<div className="behaviour-summary">

<div className="summary-card">

<div className="summary-title">
Average Journey
</div>

<div className="summary-value">
{report.average_journey}
</div>

</div>

<div className="summary-card">

<div className="summary-title">
Average Zones
</div>

<div className="summary-value">
{report.average_zones}
</div>

</div>

<div className="summary-card">

<div className="summary-title">
Customers
</div>

<div className="summary-value">
{report.customer_summary.length}
</div>

</div>

<div className="summary-card">

<div className="summary-title">
Behaviours
</div>

<div className="summary-value">
{behaviourChart.length}
</div>

</div>

</div>

<div className="behaviour-grid">

<div className="behaviour-card">

<h3>Behaviour Distribution</h3>

<ResponsiveContainer
width="100%"
height={280}
>

<PieChart>

<Pie

data={behaviourChart}

dataKey="value"

outerRadius={95}

label

>

{

behaviourChart.map((entry,index)=>(

<Cell
key={index}
fill={COLORS[index%COLORS.length]}
/>

))

}

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>

<div className="behaviour-card">

<h3>Behaviour Overview</h3>

<ResponsiveContainer
width="100%"
height={280}
>

<BarChart
data={behaviourChart}
>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="name"/>

<YAxis/>

<Tooltip/>

<Legend/>

<Bar
dataKey="value"
fill="#3B82F6"
/>

</BarChart>

</ResponsiveContainer>

</div>

</div>

<div className="behaviour-card">

<h3>Customer Behaviour Table</h3>

<div className="behaviour-table">

<table>

<thead>

<tr>

<th>ID</th>

<th>Behaviour</th>

<th>Journey</th>

<th>Zones</th>

<th>Purchase</th>

</tr>

</thead>

<tbody>

{


report.customer_summary
.sort((a,b)=>

(b.purchase_intent*100+b.journey_length+b.zones)

-

(a.purchase_intent*100+a.journey_length+a.zones)

)

.slice(0,5)

.map((item)=>(

<tr key={item.track_id}>

<td>{item.track_id}</td>

<td>{item.behaviour}</td>

<td>{item.journey_length}</td>

<td>{item.zones}</td>

<td>{item.purchase_intent}</td>

</tr>

))

}

</tbody>

</table>

</div>

</div>

<div className="behaviour-card">

<h3>AI Behaviour Insights</h3>

<ul className="insight-list">

<li>
Average customer journey :
<strong> {report.average_journey}</strong>
</li>

<li>
Average zones visited :
<strong> {report.average_zones}</strong>
</li>

<li>
Detected customer behaviours :
<strong> {behaviourChart.length}</strong>
</li>

<li>
Live customer tracking active.
</li>

</ul>

</div>

</div>

    );

}