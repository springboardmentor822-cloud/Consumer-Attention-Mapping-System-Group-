import "../styles/ReportTable.css";
import {
  FaFilePdf,
  FaFileExcel,
  FaDownload,
  FaSearch,
} from "react-icons/fa";

function ReportTable() {

  const reports = [
    {
      id: 1,
      name: "Sales Report",
      date: "Today",
      type: "PDF",
    },
    {
      id: 2,
      name: "Visitor Report",
      date: "Today",
      type: "Excel",
    },
    {
      id: 3,
      name: "AI Detection Report",
      date: "Weekly",
      type: "PDF",
    },
    {
      id: 4,
      name: "Revenue Report",
      date: "Monthly",
      type: "PDF",
    },
  ];

  return (
    <div className="report-container">

      <div className="report-header">

        <h2>📄 Reports</h2>

        <button className="export-btn">

          <FaDownload />

          Export All

        </button>

      </div>

      <div className="report-search">

        <FaSearch />

        <input
          type="text"
          placeholder="Search Reports..."
        />

      </div>

      <table className="report-table">

        <thead>

          <tr>

            <th>Report Name</th>

            <th>Date</th>

            <th>Type</th>

            <th>Download</th>

          </tr>

        </thead>

        <tbody>

          {reports.map((report) => (

            <tr key={report.id}>

              <td>{report.name}</td>

              <td>{report.date}</td>

              <td>

                {report.type === "PDF" ? (
                  <span className="pdf">

                    <FaFilePdf />

                    PDF

                  </span>
                ) : (
                  <span className="excel">

                    <FaFileExcel />

                    Excel

                  </span>
                )}

              </td>

              <td>

                <button className="download-btn">

                  <FaDownload />

                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default ReportTable;