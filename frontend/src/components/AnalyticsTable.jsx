import { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";

import "../styles/AnalyticsTable.css";

function AnalyticsTable({ consumers = [] }) {

  const [search, setSearch] = useState("");

  const filteredConsumers = useMemo(() => {

    const keyword = search.toLowerCase().trim();

    if (!keyword) return consumers;

    return consumers.filter((consumer) =>

      consumer.gender?.toLowerCase().includes(keyword) ||

      consumer.age_group?.toLowerCase().includes(keyword) ||

      consumer.emotion?.toLowerCase().includes(keyword) ||

      consumer.store_name?.toLowerCase().includes(keyword)

    );

  }, [consumers, search]);

  return (

    <div className="analytics-table-container">

      <div className="table-header">

        <h2>Consumer Analytics</h2>

        <div className="table-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Search Consumer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

      </div>

      <div className="table-wrapper">

        <table className="analytics-table">

          <thead>

            <tr>

              <th>ID</th>

              <th>Gender</th>

              <th>Age Group</th>

              <th>Dwell Time (sec)</th>

              <th>Attention Score</th>

              <th>Emotion</th>

              <th>Store</th>

              <th>Visit Time</th>

            </tr>

          </thead>

          <tbody>

            {

              filteredConsumers.length > 0

                ?

                filteredConsumers.map((consumer) => (

                  <tr key={consumer.id}>

                    <td>{consumer.id}</td>

                    <td>{consumer.gender}</td>

                    <td>{consumer.age_group}</td>

                    <td>{consumer.dwell_time}</td>

                    <td>

                      {Number(
                        consumer.attention_score ?? 0
                      ).toFixed(2)}%

                    </td>

                    <td>

                      <span
                        className={`emotion-badge ${(
                          consumer.emotion || ""
                        ).toLowerCase()}`}
                      >

                        {consumer.emotion}

                      </span>

                    </td>

                    <td>{consumer.store_name}</td>

                    <td>

                      {

                        consumer.visit_time

                          ?

                          new Date(
                            consumer.visit_time
                          ).toLocaleString()

                          :

                          "-"

                      }

                    </td>

                  </tr>

                ))

                :

                (

                  <tr>

                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        padding: "20px",
                      }}
                    >

                      No analytics data available.

                    </td>

                  </tr>

                )

            }

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default AnalyticsTable;