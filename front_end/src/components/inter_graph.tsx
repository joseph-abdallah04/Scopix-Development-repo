import React, { useEffect, useRef } from "react"
import * as echarts from "echarts"
import { useTheme } from "../contexts/theme-context"
import { useFullscreen } from "../contexts/fullscreen"

interface InterGraphProps {
  data?: {
    id: string
    data: { x: number; y: number }[]
  }[]
}

const InterGraph: React.FC<InterGraphProps> = ({ data = [] }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const { isDarkMode } = useTheme()
  const {
    ref: containerRef,
    isFullscreen  } = useFullscreen<HTMLDivElement>()

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return

    const chart = echarts.init(chartRef.current, null, { renderer: "canvas" })

    const series = data.map((d) => ({
      name: d.id,
      type: "line",
      showSymbol: false,
      smooth: true,
      data: d.data.map((p) => [p.x, p.y]),
    }))

    const textColor = isDarkMode ? "#fff" : "#333"
    const backgroundColor = isDarkMode ? "#1F2937" : "#F9FAFB"
    const axisLabelColor = isDarkMode ? "#ccc" : "#666"
    const splitLineColor = isDarkMode ? "#444" : "#ddd"
    const borderColor = isDarkMode ? "#ccc" : "#999"
    const chartBackgroundColor = isFullscreen && !isDarkMode ? "#ffffff" : "transparent"

    chart.setOption({
      backgroundColor: chartBackgroundColor,
      grid: {
        top: 100,
        bottom: 60,
        containLabel: true
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: backgroundColor,
        borderWidth: 0,
        textStyle: {
          color: textColor,
          fontSize: 12,
        },
        extraCssText: `
          background-color: ${backgroundColor} !important;
          opacity: 1 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border-radius: 6px;
        `
      },

      legend: {top: 10, textStyle: { color: textColor } },
      xAxis: {
        type: "value",
        name: "Time",
        axisLabel: { color: axisLabelColor },
        nameTextStyle: { color: textColor },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      yAxis: {
        type: "value",
        name: "Value",
        axisLabel: { color: axisLabelColor },
        nameTextStyle: { color: textColor },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: { yAxisIndex: "none" },
          restore: {},
          saveAsImage: {},
        },
        iconStyle: { borderColor },
        top: 10,
        left: 50,
      },
      dataZoom: [
        { type: "inside", xAxisIndex: 0 },
        {
          type: "slider",
          xAxisIndex: 0,
          height: 25,
          bottom: 20,
          textStyle: { color: axisLabelColor },
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
  }, [data, isDarkMode, isFullscreen])


  useEffect(() => {
    if (!containerRef.current || !chartRef.current) return
    const chartInstance = echarts.getInstanceByDom(chartRef.current!)
    const observer = new ResizeObserver(() => chartInstance?.resize())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${isFullscreen ? "h-screen" : "min-h-[200px]"}`}
    >
      {(!data || data.length === 0) ? (
        <div className={`w-full h-[500px] rounded-xl border flex items-center justify-center transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-transparent border-gray-600 text-gray-500' 
            : 'bg-transparent border-gray-300 text-gray-400'
        }`}>
          <p>No data available to display</p>
        </div>
      ) : (
        <div
            ref={chartRef}
            className={`w-full h-full rounded-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-transparent border-gray-600' 
                : 'bg-transparent border-gray-300'
            }`}
          />
      )}
    </div>
  )
}

export default InterGraph

