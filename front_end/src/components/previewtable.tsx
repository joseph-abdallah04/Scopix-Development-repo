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

interface PreviewTableProps {
  data: DataRow[]
  isFullscreen?: boolean
}

export default function PreviewTable({ data, isFullscreen = false }: PreviewTableProps) {
  const { isDarkMode } = useTheme()
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = isFullscreen ? 50 : 15

  if (!data || data.length === 0) {
    return (
      <div className="w-full text-center py-6 text-gray-400">
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
    <div className={`w-full rounded-xl border shadow text-sm ${
      isFullscreen ? 'h-full flex flex-col' : ''
    } ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600 text-white shadow-gray-900/50' 
        : 'bg-white border-gray-300 text-gray-800 shadow-gray-400/30'
    }`}>
      {/* Scrollable table container */}
      <div className={`overflow-x-auto ${
        isFullscreen ? 'flex-1 p-4' : 'p-4 pt-4'
      }`}>
        <table className="table-auto w-full border-collapse mt-4">
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={`px-3 py-2 text-left border ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-300'
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
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No data
                </td>
              </tr>
            ) : (
              currentRows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`px-3 py-1 border ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls - outside scrollable area */}
      <div className={`flex justify-between items-center p-4 text-sm border-t ${
        isFullscreen ? 'flex-shrink-0' : ''
      } ${
        isDarkMode ? 'border-gray-600' : 'border-gray-300'
      }`}>
        <button
          onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          disabled={pageIndex === 0}
          className={`px-3 py-1 rounded disabled:opacity-50 transition-colors ${
            isDarkMode 
              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
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
          className={`px-3 py-1 rounded disabled:opacity-50 transition-colors ${
            isDarkMode 
              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  )
}

