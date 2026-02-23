"use client";

import { useState } from "react";
import type { LogResponse } from "@/lib/dashboard-types";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import { useGetLogsQuery } from "./_service/logsApi";
import "../products/products-modal.css";

const COLUMNS: DataTableColumn<LogResponse>[] = [
  { key: "id", label: "ID", width: "60px" },
  { key: "logType", label: "Tipo" },
  { key: "eventType", label: "Evento" },
  { key: "description", label: "Descripción" },
  { key: "userId", label: "User", width: "70px" },
  { key: "createdAt", label: "Fecha", type: "date" },
];

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [logType, setLogType] = useState(-1);
  const [eventType, setEventType] = useState(-1);

  const { data: result, isLoading } = useGetLogsQuery({
    page,
    perPage: pageSize,
    logType: logType >= 0 ? logType : undefined,
    eventTypeLog: eventType >= 0 ? eventType : undefined,
  });

  const allRows = result?.data ?? [];
  const filteredData = searchTerm.trim()
    ? allRows.filter((r) =>
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : allRows;

  return (
    <>
      <div className="dt-card">
        <div className="dt-header">
          <h1 className="dt-header__title">Logs del sistema</h1>
        </div>
        <div className="dt-toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="modal-field" style={{ margin: 0, minWidth: 140 }}>
            <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#6b7280" }}>Tipo de log</label>
            <select
              value={logType}
              onChange={(e) => {
                setLogType(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: "0.9rem",
                minWidth: "100%",
              }}
            >
              <option value={-1}>Todos</option>
              <option value={0}>Application</option>
              <option value={1}>System</option>
              <option value={2}>Security</option>
            </select>
          </div>
          <div className="modal-field" style={{ margin: 0, minWidth: 140 }}>
            <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#6b7280" }}>Tipo de evento</label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: "0.9rem",
                minWidth: "100%",
              }}
            >
              <option value={-1}>Todos</option>
              <option value={0}>Information</option>
              <option value={1}>Warning</option>
              <option value={2}>Error</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={filteredData}
        columns={COLUMNS}
        loading={isLoading}
        title="Logs"
        titleIcon="receipt_long"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        pagination={result?.pagination ?? undefined}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        emptyIcon="receipt_long"
        emptyTitle="Sin registros"
        emptyDesc={searchTerm ? "No se encontraron resultados" : "No hay logs"}
      />
    </>
  );
}
