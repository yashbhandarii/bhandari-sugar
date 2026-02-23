# Next Step: Create AgingReportPage.js

**Status**: ⚠️ Referenced in App.js but file not created

The AgingReportPage.js is imported in App.js but doesn't exist yet. This will cause a routing error when users navigate to `/reports/aging`.

## Quick Implementation

Create the file at: `frontend/src/pages/AgingReportPage.js`

```javascript
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import DatePicker from "react-datepicker";
import "react-datepicker/theme/default.css";

const AgingReportPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async (date = selectedDate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/aging`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch aging report");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/download?type=aging&format=pdf`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("PDF download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aging_report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download PDF");
    }
  };

  const getRiskColor = (days) => {
    if (days <= 7) return "bg-green-50 border-green-200";
    if (days <= 15) return "bg-yellow-50 border-yellow-200";
    if (days <= 30) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  const getRiskBadge = (days) => {
    if (days <= 7)
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          LOW RISK
        </span>
      );
    if (days <= 15)
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
          MEDIUM
        </span>
      );
    if (days <= 30)
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
          HIGH
        </span>
      );
    return (
      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
        🚨 CRITICAL
      </span>
    );
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aging Report</h1>
            <p className="text-gray-600 mt-2">Customer invoices by age</p>
          </div>
          <button
            onClick={downloadPDF}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            📥 Download PDF
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="text-green-700 text-sm font-semibold">
                0-7 Days
              </div>
              <div className="text-2xl font-bold text-green-900">
                {data.summary.bucket_0_7_count || 0}
              </div>
              <div className="text-green-700 text-sm">
                ₹{(data.summary.bucket_0_7_total || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="text-yellow-700 text-sm font-semibold">
                8-15 Days
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {data.summary.bucket_8_15_count || 0}
              </div>
              <div className="text-yellow-700 text-sm">
                ₹{(data.summary.bucket_8_15_total || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="text-orange-700 text-sm font-semibold">
                16-30 Days
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {data.summary.bucket_16_30_count || 0}
              </div>
              <div className="text-orange-700 text-sm">
                ₹{(data.summary.bucket_16_30_total || 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="text-red-700 text-sm font-semibold">30+ Days</div>
              <div className="text-2xl font-bold text-red-900">
                {data.summary.bucket_30_plus_count || 0}
              </div>
              <div className="text-red-700 text-sm">
                ₹{(data.summary.bucket_30_plus_total || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Table */}
        {data?.details && data.details.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Invoice ID
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Days Pending
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.details.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b ${getRiskColor(row.days_pending)}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {row.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.invoice_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold">
                      ₹{parseFloat(row.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {row.days_pending}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getRiskBadge(row.days_pending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg text-center text-gray-500">
            No pending invoices to display
          </div>
        )}
      </div>
    </div>
  );
};

export default AgingReportPage;
```

## Next Steps

1. **Create the file** with the code above
2. **Verify App.js imports** it correctly:
   ```javascript
   const AgingReportPage = lazy(() => import("./pages/AgingReportPage"));
   ```
3. **Test navigation** to `/reports/aging`
4. **Test PDF download** button

That's it! The backend is production-ready.
