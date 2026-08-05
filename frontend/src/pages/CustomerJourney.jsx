import React, { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/CustomerJourney.css";

const CustomerJourney = () => {

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [lastUpdated, setLastUpdated] = useState("");

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        exited: 0,
        interactions: 0,
        avgDwell: 0,
    });

    // ===============================
    // Load Customer Journey
    // ===============================

    const loadCustomerJourney = async () => {

        try {

            setLoading(true);

            const response = await API.get("/customer-journey/");

            const data = response.data.customers || [];

            setCustomers(data);

            calculateStats(data);

            setLastUpdated(new Date().toLocaleTimeString());

            setError("");

        } catch (err) {

            console.error(err);

            setError("Unable to load customer journey.");

        } finally {

            setLoading(false);

        }

    };

    // ===============================
    // Dashboard Statistics
    // ===============================

    const calculateStats = (data) => {

        let active = 0;
        let exited = 0;
        let interactions = 0;
        let dwell = 0;

        data.forEach((customer) => {

            if (customer.status === "Active")
                active++;

            if (customer.status === "Exited")
                exited++;

            interactions += customer.product_interactions || 0;

            dwell += customer.dwell_time || 0;

        });

        setStats({

            total: data.length,

            active,

            exited,

            interactions,

            avgDwell:
                data.length > 0
                    ? Math.round(dwell / data.length)
                    : 0,

        });

    };

    useEffect(() => {

        loadCustomerJourney();

        const interval = setInterval(() => {

            loadCustomerJourney();

        }, 3000);

        return () => clearInterval(interval);

    }, []);
    // =====================================
    // Reset Customer Journey
    // =====================================

    const resetCustomerJourney = async () => {

        const confirmReset = window.confirm(
            "Reset all customer journey data?"
        );

        if (!confirmReset) return;

        try {

            await API.post("/customer-journey/reset");

            loadCustomerJourney();

        } catch (err) {

            console.error(err);

            alert("Unable to reset customer journey.");

        }

    };

    // =====================================
    // Search + Filter
    // =====================================

    const filteredCustomers = customers
        .filter((customer) => {

            const matchesSearch =
                customer.track_id
                    ?.toString()
                    .includes(search) ||

                customer.camera_id
                    ?.toString()
                    .includes(search);

            const matchesStatus =
                statusFilter === "All"
                    ? true
                    : customer.status === statusFilter;

            return matchesSearch && matchesStatus;

        })

        // Show ONLY Active Customers
        .filter((customer) => customer.status === "Active")

        // Highest Attention First
        .sort(
            (a, b) =>
                (b.attention_score || 0) -
                (a.attention_score || 0)
        )

        // Only Top 5
        .slice(0, 5);

    // =====================================
    // JSX
    // =====================================

    return (

        <div className="customerJourney">

            <div className="pageHeader">

                <h2>Customer Journey</h2>

                <p>

                    Live tracking of customer movement,
                    dwell time and customer interactions.

                </p>

            </div>

            {/* Dashboard Cards */}

            <div className="journeyCards">

                <div className="journeyCard">

                    <h3>Total Customers</h3>

                    <h1>{stats.total}</h1>

                </div>

                <div className="journeyCard">

                    <h3>Active</h3>

                    <h1>{stats.active}</h1>

                </div>

                <div className="journeyCard">

                    <h3>Exited</h3>

                    <h1>{stats.exited}</h1>

                </div>

                <div className="journeyCard">

                    <h3>Interactions</h3>

                    <h1>{stats.interactions}</h1>

                </div>

                <div className="journeyCard">

                    <h3>Avg Dwell</h3>

                    <h1>{stats.avgDwell}s</h1>

                </div>

            </div>

            {/* Toolbar */}

            <div className="toolbar">

                <input

                    type="text"

                    placeholder="Search Track ID / Camera"

                    value={search}

                    onChange={(e) =>
                        setSearch(e.target.value)
                    }

                />

                <select

                    value={statusFilter}

                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }

                >

                    <option value="All">

                        All

                    </option>

                    <option value="Active">

                        Active

                    </option>

                    <option value="Exited">

                        Exited

                    </option>

                </select>

                <button

                    className="refreshBtn"

                    onClick={loadCustomerJourney}

                >

                    Refresh

                </button>

                <button

                    className="resetBtn"

                    onClick={resetCustomerJourney}

                >

                    Reset

                </button>

            </div>

            <div className="lastUpdated">

                Last Updated : {lastUpdated}

            </div>

            {loading && (

                <div className="loading">

                    Loading customer journey...

                </div>

            )}

            {error && (

                <div className="error">

                    {error}

                </div>

            )}
            {/* ========================================= */}
            {/* Customer Journey Table */}
            {/* ========================================= */}

            <div className="tableContainer">

                <table className="journeyTable">

                    <thead>

                        <tr>

                            <th>Track ID</th>

                            <th>Camera</th>

                            <th>Status</th>

                            <th>Entry Time</th>

                            <th>Exit Time</th>

                            <th>Dwell</th>

                            <th>Interactions</th>

                            <th>Attention</th>

                            <th>Path</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredCustomers.length > 0 ? (

                            filteredCustomers.map((customer) => (

                                <tr key={customer.track_id}>

                                    <td>
                                        #{customer.track_id}
                                    </td>

                                    <td>
                                        Camera {customer.camera_id}
                                    </td>

                                    <td>

                                        <span className="status active">

                                            Active

                                        </span>

                                    </td>

                                    <td>

                                        {customer.entry_time || "--"}

                                    </td>

                                    <td>

                                        {customer.exit_time || "--"}

                                    </td>

                                    <td>

                                        {customer.dwell_time}s

                                    </td>

                                    <td>

                                        {customer.product_interactions}

                                    </td>

                                    <td>

                                        <span className="attentionBadge">

                                            {customer.attention_score}%

                                        </span>

                                    </td>

                                    <td>

                                        {customer.path_points}

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="9"
                                    className="noData"
                                >

                                    No Active Customers

                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>
            {/* ========================================= */}
            {/* Footer */}
            {/* ========================================= */}

            <div className="journeyFooter">

                <div className="footerLeft">

                    Showing

                    <strong> {filteredCustomers.length} </strong>

                    Active Customers

                </div>

                <div className="footerRight">

                    Auto Refresh :

                    <strong> Every 3 Seconds</strong>

                </div>

            </div>

        </div>

    );

};

export default CustomerJourney;