import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"
import { useTheme } from "../contexts/theme-context"

type DataRow = Record<string, string | number | null>

export default function PreviewTable({ data }: { data: DataRow[] }) {
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 15
  const { isDarkMode } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className={`w-full text-center py-6 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-400'
      }`}>
          No data available
      </div>
    )
  }

  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    return Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: key.toUpperCase(),
      cell: (info) => String(info.getValue() ?? ""),
    }))
  }, [data])

  const table = useReactTable({
    data,
    columns,
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater
      setPageIndex(next.pageIndex)
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: Math.ceil(data.length / pageSize),
  })

  const currentRows = table.getPaginationRowModel().rows

  return (
    <div className={`relative w-full overflow-x-auto rounded-xl border p-4 pt-4 shadow text-sm transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600 text-white' 
        : 'bg-white border-gray-300 text-gray-900'
    }`}>
      <table className="table-auto w-full border-collapse mt-4">
        <thead className={`${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className={`border px-3 py-2 text-left ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-200' 
                    : 'border-gray-300 text-gray-800'
                }`}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {currentRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={`text-center py-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                No data
              </td>
            </tr>
          ) : (
            currentRows.map((row) => (
              <tr key={row.id} className={`${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`border px-3 py-1 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-200' 
                      : 'border-gray-300 text-gray-800'
                  }`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className={`flex justify-between items-center mt-4 text-sm ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        <button
          onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          disabled={pageIndex === 0}
          className={`px-3 py-1 rounded transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-800 disabled:text-gray-500'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50'
          }`}
        >
          Previous
        </button>
        <span>
          Page {pageIndex + 1} / {table.getPageCount()}
        </span>
        <button
          onClick={() =>
            setPageIndex((i) =>
              Math.min(table.getPageCount() - 1, i + 1)
            )
          }
          disabled={pageIndex >= table.getPageCount() - 1}
          className={`px-3 py-1 rounded transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-800 disabled:text-gray-500'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  )
}

