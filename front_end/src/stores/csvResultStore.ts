// src/stores/csvResultStore.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

type ChartDatum = {
  id: string
  data: { x: number; y: number }[]
}

type DataRow = Record<string, string | number | null>

interface CSVResultState {
  result: ChartDatum[] | null
  segmentData: DataRow[]
  setResult: (data: ChartDatum[]) => void
  setSegmentData: (data: DataRow[]) => void
  clearResult: () => void
}

export const useCSVResultStore = create<CSVResultState>()(
  persist(
    (set) => ({
      result: null,
      segmentData: [],
      setResult: (data) => set({ result: data }),
      setSegmentData: (data) => set({ segmentData: data }),
      clearResult: () => set({ result: null, segmentData: [] })
    }),
    {
      name: "csv-result-storage"
    }
  )
)

