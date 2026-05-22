import React from "react";
import * as XLSX from "xlsx";

export default function TATCalculator() {
  const [bulkResults, setBulkResults] = React.useState([]);
  const [pasteData, setPasteData] = React.useState("");

  const WORK_START = 10;
  const WORK_END = 19;

  const addBusinessHours = (startDate, hoursToAdd) => {
    let current = new Date(startDate);
    let remainingMinutes = hoursToAdd * 60;

    while (remainingMinutes > 0) {
      if (current.getDay() === 0) {
        current.setDate(current.getDate() + 1);
        current.setHours(WORK_START, 0, 0, 0);
        continue;
      }

      if (current.getHours() < WORK_START) {
        current.setHours(WORK_START, 0, 0, 0);
      }

      if (
        current.getHours() > WORK_END ||
        (current.getHours() === WORK_END && current.getMinutes() > 0)
      ) {
        current.setDate(current.getDate() + 1);
        current.setHours(WORK_START, 0, 0, 0);
        continue;
      }

      const endOfDay = new Date(current);
      endOfDay.setHours(WORK_END, 0, 0, 0);

      const availableMinutes = Math.floor(
        (endOfDay.getTime() - current.getTime()) / (1000 * 60)
      );

      if (remainingMinutes <= availableMinutes) {
        current = new Date(
          current.getTime() + remainingMinutes * 60 * 1000
        );
        remainingMinutes = 0;
      } else {
        remainingMinutes -= availableMinutes;
        current.setDate(current.getDate() + 1);
        current.setHours(WORK_START, 0, 0, 0);
      }
    }

    return current;
  };

  const formatDate12Hour = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours || 12;

    return `${day}-${month}-${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const formatDate24Hour = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const parseExcelDate = (value) => {
    if (!value) return null;

    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);

      return new Date(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H,
        parsed.M,
        parsed.S
      );
    }

    // Handle DD-MM-YYYY HH:mm format
    if (typeof value === "string") {
      const parts = value.trim().split(" ");

      if (parts.length >= 2) {
        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split("-").map(Number);
        const [hour, minute] = timePart.split(":").map(Number);

        return new Date(year, month - 1, day, hour, minute);
      }
    }

    return new Date(value);
  };

  const processTableData = (rows) => {
    const processed = rows.map((row, index) => {
      const created = parseExcelDate(row["CREATED DATE & TIME"]);

      if (!created || isNaN(created.getTime())) {
        return {
          "WORK ORDER": row["WORK ORDER"] || `WO-${index + 1}`,
          ERROR: "Invalid date format",
        };
      }

      const tat4 = addBusinessHours(created, 4);

      const tat24 = new Date(created);
      tat24.setDate(tat24.getDate() + 1);

      if (tat24.getDay() === 0) {
        tat24.setDate(tat24.getDate() + 1);
      }

      const now = new Date();

      return {
        "WORK ORDER": row["WORK ORDER"] || `WO-${index + 1}`,
        "CREATED DATE & TIME": formatDate24Hour(created),
        "4 HRS TAT STATUS": now <= tat4 ? "WITHIN 4 HRS" : "CROSSED",
        "4 HRS TAT DATE & TIME": formatDate12Hour(tat4),
        "24 HRS TAT STATUS": now <= tat24 ? "WITHIN 24 HRS" : "CROSSED",
        "24 HRS TAT DATE & TIME": formatDate12Hour(tat24),
      };
    });

    setBulkResults(processed);
  };

  

  const handlePasteSubmit = () => {
    if (!pasteData.trim()) {
      alert("Please paste table data");
      return;
    }

    const lines = pasteData.trim().split("\n");

    const rows = lines.map((line, index) => {
      const cols = line.split("	");

      return {
        "WORK ORDER": cols[0]?.trim() || `WO-${index + 1}`,
        "CREATED DATE & TIME": cols[1]?.trim() || "",
      };
    });

    processTableData(rows);
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-6">
      <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-8 w-full max-w-7xl border border-white/20">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            TAT CALCULATOR
          </div>
        </div>

        <h1 className="text-5xl font-extrabold text-center mb-3 bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
          TAT Calculator
        </h1>

        <p className="text-center text-gray-600 mb-10 text-lg leading-relaxed">
          Calculate 4 Hours and 24 Hours TAT between 10:00 AM to 7:00 PM
        </p>

        <div className="space-y-8">
          <div className="bg-gradient-to-r from-slate-50 to-cyan-50 border border-cyan-100 rounded-2xl p-6 shadow-sm">
            <label className="block text-base font-semibold text-slate-700 mb-3">
              Copy & Paste Table Data
            </label>

            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              rows={8}
              placeholder={`Paste data in this format:
WO001	21-05-2026 13:35
WO002	21-05-2026 17:45
WO003	22-05-2026 18:16`}
              className="w-full border border-cyan-200 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />

            <button
              type="button"
              onClick={handlePasteSubmit}
              className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all duration-300"
            >
              Generate Result From Paste Data
            </button>
          </div>

          

          {bulkResults.length > 0 && (
            <div className="overflow-auto border border-slate-200 rounded-3xl mt-8 shadow-2xl bg-white">
              <table className="w-full text-sm border-collapse overflow-hidden">
                <thead className="bg-gradient-to-r from-blue-700 to-cyan-500 text-white">
                  <tr>
                    <th className="border border-white/20 p-4 text-sm font-bold tracking-wide">
                      WORK ORDER
                    </th>
                    <th className="border border-white/20 p-4 text-sm font-bold tracking-wide">
                      CREATED DATE & TIME
                    </th>
                    <th className="border border-white/20 p-4 text-sm font-bold tracking-wide">
                      4 HRS TAT STATUS
                    </th>
                    <th className="border border-white/20 p-4 text-sm font-bold tracking-wide">
                      4 HRS TAT DATE & TIME
                    </th>
                    <th className="border border-white/20 p-4 text-sm font-bold tracking-wide">
                      24 HRS TAT STATUS
                    </th>
                    <th className="border border-white/20 p-4 text-sm font-bold tracking-wide">
                      24 HRS TAT DATE & TIME
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {bulkResults.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-slate-200 p-4 text-slate-700">
                        {item["WORK ORDER"]}
                      </td>

                      <td className="border border-slate-200 p-4 text-slate-700">
                        {item["CREATED DATE & TIME"]}
                      </td>

                      <td className="border border-slate-200 p-4 font-bold">
                        {item["4 HRS TAT STATUS"]}
                      </td>

                      <td className="border border-slate-200 p-4 text-slate-700">
                        {item["4 HRS TAT DATE & TIME"]}
                      </td>

                      <td className="border border-slate-200 p-4 font-bold">
                        {item["24 HRS TAT STATUS"]}
                      </td>

                      <td className="border border-slate-200 p-4 text-slate-700">
                        {item["24 HRS TAT DATE & TIME"]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-10 text-sm text-slate-500 text-center border-t pt-6">
          Working Hours: Monday to Saturday | 10:00 AM - 7:00 PM
        </div>
      </div>
    </div>
  );
}
