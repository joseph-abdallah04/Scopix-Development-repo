import React, { useEffect, useRef, useState } from "react"
import * as echarts from "echarts"
import { FiMaximize, FiMinimize } from "react-icons/fi"

interface InterGraphProps {
  data?: {
    id: string
    data: { x: number; y: number }[]
  }[]
}

const InterGraph: React.FC<InterGraphProps> = ({ data = [] }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return

    const chart = echarts.init(chartRef.current, null, {
      renderer: "canvas",
      backgroundColor: "transparent",
    })

    const series = data.map((d) => ({
      name: d.id,
      type: "line",
      showSymbol: false,
      smooth: true,
      data: d.data.map((p) => [p.x, p.y]),
    }))

    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        textStyle: { color: "#fff" },
        backgroundColor: "#111827",
      },
      legend: { textStyle: { color: "#fff" } },
      xAxis: {
        type: "value",
        name: "Time",
        axisLabel: { color: "#ccc" },
        nameTextStyle: { color: "#fff" },
        splitLine: { lineStyle: { color: "#cccccc" } },
      },
      yAxis: {
        type: "value",
        name: "Value",
        axisLabel: { color: "#ccc" },
        nameTextStyle: { color: "#fff" },
        splitLine: { lineStyle: { color: "#cccccc" } },
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: { yAxisIndex: "none" },
          restore: {},
          saveAsImage: {},
        },
        iconStyle: { borderColor: "#ccc" },
        top: 5,
        left: 10,
      },
      dataZoom: [
        { type: "inside", xAxisIndex: 0 },
        {
          type: "slider",
          xAxisIndex: 0,
          height: 20,
          bottom: 10,
          textStyle: { color: "#ccc" },
        },
      ],
      series,
    })

    chart.resize()

    const handleResize = () => chart.resize()
    window.addEventListener("resize", handleResize)

    return () => {
      chart.dispose()
      window.removeEventListener("resize", handleResize)
    }
  }, [data])

  useEffect(() => {
    if (!containerRef.current) return
    const chartInstance = echarts.getInstanceByDom(chartRef.current!)
    const observer = new ResizeObserver(() => {
      chartInstance?.resize()
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isFullscreen ? "h-screen" : "min-h-[200px]"}`}
    >
      {(!data || data.length === 0) ? (
        <div className="w-full h-[500px] bg-transparent rounded-xl border border-gray-600 flex items-center justify-center">
          <p className="text-gray-500">No data available to display</p>
        </div>
      ) : (
        <>
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 z-10 bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-md"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
          </button>

          <div
            ref={chartRef}
            className={`w-full ${isFullscreen ? "h-full" : "h-[500px]"} bg-transparent rounded-xl border border-gray-600`}
          />
        </>
      )}
    </div>
  )
}

export default InterGraph

