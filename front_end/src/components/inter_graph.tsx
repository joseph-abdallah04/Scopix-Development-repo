import React, { useEffect, useRef, useState } from "react"
import * as echarts from "echarts"
import { FiMaximize, FiMinimize } from "react-icons/fi"
import { useTheme } from "../contexts/theme-context"

const currentFullscreenTarget = { current: null as HTMLElement | null }

interface InterGraphProps {
  data?: {
    id: string
    data: { x: number; y: number }[]
  }[]
}

const InterGraph: React.FC<InterGraphProps> = ({ data = [] }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollYBeforeFullscreen = useRef<number>(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { isDarkMode } = useTheme()

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)

      if (!isNowFullscreen) {

        if (currentFullscreenTarget.current === containerRef.current) {
          setTimeout(() => {
            window.scrollTo({
              top: scrollYBeforeFullscreen.current,
              behavior: "auto",
            })
          }, 50)
        }

        currentFullscreenTarget.current = null
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])



    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        requestAnimationFrame(() => {
          scrollYBeforeFullscreen.current = window.scrollY
          currentFullscreenTarget.current = containerRef.current
          containerRef.current?.requestFullscreen()
        })
      } else {
        document.exitFullscreen()
      }
    }



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
        <>
          <button
            onClick={toggleFullscreen}
            className={`absolute top-2 right-2 z-10 p-2 rounded-md transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
          </button>

          <div
            ref={chartRef}
            className={`w-full h-full rounded-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-transparent border-gray-600' 
                : 'bg-transparent border-gray-300'
            }`}
          />
        </>
      )}
    </div>
  )
}

export default InterGraph

