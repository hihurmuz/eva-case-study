<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useStore } from 'vuex'
import * as d3 from 'd3'
import SkuTable from './SkuTable.vue'

interface SalesData {
  date: string
  profit: number
  fbaAmount: number
  fbmAmount: number
  fbaShippingAmount: number
  totalSales: number
}

const store = useStore()
const selectedPeriod = ref('Last 30 Days')
const periods = ['Last 60 Days', 'Last 30 Days', 'Last 14 Days', 'Last 7 Days']

const periodToDays: Record<string, number> = {
  'Last 60 Days': 60,
  'Last 30 Days': 30,
  'Last 14 Days': 14,
  'Last 7 Days': 7,
}

const selectedMetrics = ref<string[]>(['FBM', 'FBA', 'Profit'])
const availableMetrics = ['FBM', 'FBA', 'Profit']

const chartData = computed<SalesData[]>(() => store.state.dailySalesData)
const chartContainer = ref<HTMLDivElement | null>(null)
const isLoading = ref(false)
const selectedDates = ref<string[]>([])

const toggleMetric = (metric: string) => {
  const index = selectedMetrics.value.indexOf(metric)
  if (index > -1) {
    selectedMetrics.value.splice(index, 1)
  } else {
    selectedMetrics.value.push(metric)
  }
}

const handleBarClick = (date: string) => {
  const index = selectedDates.value.indexOf(date)
  if (index > -1) {
    // Deselect
    selectedDates.value.splice(index, 1)
  } else {
    // Select (max 2 dates)
    if (selectedDates.value.length >= 2) {
      selectedDates.value.shift() // Remove first date
    }
    selectedDates.value.push(date)
  }
  console.log('Selected dates:', selectedDates.value)
}

const handleRemoveDate = (date: string) => {
  const index = selectedDates.value.indexOf(date)
  if (index > -1) {
    selectedDates.value.splice(index, 1)
    // Redraw chart to update selection styling
    setTimeout(() => drawChart(), 10)
  }
}

const drawChart = () => {
  if (!chartContainer.value || chartData.value.length === 0) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  const margin = { top: 20, right: 100, bottom: 80, left: 60 }
  const width = chartContainer.value.clientWidth - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  const svg = d3
    .select(chartContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Build stack keys based on selected metrics
  const stackKeys: (keyof SalesData)[] = []
  const metricsMap: Record<string, keyof SalesData> = {
    'FBM': 'fbmAmount',
    'FBA': 'fbaAmount',
    'Profit': 'profit'
  }

  selectedMetrics.value.forEach(metric => {
    if (metricsMap[metric]) {
      stackKeys.push(metricsMap[metric])
    }
  })

  // If no metrics selected, show all
  if (stackKeys.length === 0) {
    stackKeys.push('fbmAmount', 'fbaAmount', 'profit')
  }

  // Stack the data
  const stack = d3.stack<SalesData>().keys(stackKeys)
  const series = stack(chartData.value)

  // Scales
  const x = d3
    .scaleBand()
    .domain(chartData.value.map((d) => d.date))
    .range([0, width])
    .padding(0.3)

  const maxValue = d3.max(series, (d) => d3.max(d, (d) => d[1])) || 100

  const y = d3
    .scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([height, 0])

  // Colors - map colors to specific metrics
  const colorMap: Record<string, string> = {
    'fbmAmount': '#8B5CF6',
    'fbaAmount': '#6366F1',
    'profit': '#06B6D4'
  }

  const colors = stackKeys.map(key => colorMap[key as string] || '#999')

  // Create tooltip
  const tooltip = d3
    .select(chartContainer.value)
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background-color', 'white')
    .style('color', '#1F2937')
    .style('padding', '12px')
    .style('border-radius', '8px')
    .style('font-size', '13px')
    .style('pointer-events', 'none')
    .style('z-index', '1000')
    .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.15)')
    .style('border', '1px solid #E5E7EB')

  // Draw bars
  svg
    .selectAll('g.layer')
    .data(series)
    .enter()
    .append('g')
    .attr('class', 'layer')
    .attr('fill', (d, i) => colors[i] || '#999')
    .selectAll('rect')
    .data((d) => d)
    .enter()
    .append('rect')
    .attr('x', (d) => x(d.data.date) || 0)
    .attr('y', (d) => y(d[1]))
    .attr('height', (d) => y(d[0]) - y(d[1]))
    .attr('width', x.bandwidth())
    .attr('rx', 2)
    .style('cursor', 'pointer')
    .style('stroke', (d) => selectedDates.value.includes(d.data.date) ? '#1F2937' : 'none')
    .style('stroke-width', (d) => selectedDates.value.includes(d.data.date) ? 2 : 0)
    .on('click', function (event, d) {
      handleBarClick(d.data.date)
      // Redraw to update selection styling
      setTimeout(() => drawChart(), 10)
    })
    .on('mouseover', function (event, d) {
      const data = d.data
      tooltip
        .style('visibility', 'visible')
        .html(`
          <div style="font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; color: #111827;">
            ${data.date}
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #6B7280;">Total Sales:</span>
              <span style="font-weight: 600; color: #111827;">$${data.totalSales.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #6B7280;">Shipping:</span>
              <span style="font-weight: 600; color: #111827;">$${data.fbaShippingAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #6B7280;">Profit:</span>
              <span style="font-weight: 600; color: #10B981;">$${data.profit.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #6B7280;">FBA Sales:</span>
              <span style="font-weight: 600; color: #111827;">$${data.fbaAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #6B7280;">FBM Sales:</span>
              <span style="font-weight: 600; color: #111827;">$${data.fbmAmount.toFixed(2)}</span>
            </div>
          </div>
        `)
      d3.select(this).style('opacity', 0.8)
    })
    .on('mousemove', function (event) {
      const containerRect = chartContainer.value?.getBoundingClientRect()
      if (containerRect) {
        const x = event.clientX - containerRect.left + 15
        const y = event.clientY - containerRect.top - 10
        tooltip
          .style('top', y + 'px')
          .style('left', x + 'px')
      }
    })
    .on('mouseout', function () {
      tooltip.style('visibility', 'hidden')
      d3.select(this).style('opacity', 1)
    })

  // X Axis - show every nth label to avoid overcrowding
  const tickValues = chartData.value.filter((_, i) => {
    const totalDays = chartData.value.length
    const step = totalDays > 30 ? 5 : totalDays > 14 ? 2 : 1
    return i % step === 0
  }).map(d => d.date)

  const xAxis = svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(tickValues))

  xAxis
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .style('font-size', '10px')
    .style('fill', '#6B7280')

  xAxis.select('.domain').style('stroke', '#E5E7EB')
  xAxis.selectAll('.tick line').style('stroke', '#E5E7EB')

  // Y Axis
  const yAxis = svg.append('g').call(
    d3
      .axisLeft(y)
      .ticks(5)
      .tickFormat((d: d3.NumberValue) => `$${(d as number) / 1000}k`)
  )

  yAxis.select('.domain').style('stroke', '#E5E7EB')
  yAxis.selectAll('.tick line').style('stroke', '#E5E7EB')
  yAxis.selectAll('text').style('font-size', '12px').style('fill', '#6B7280')

  // Grid lines
  svg
    .selectAll('line.grid')
    .data(y.ticks(5))
    .enter()
    .append('line')
    .attr('class', 'grid')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', (d: number) => y(d))
    .attr('y2', (d: number) => y(d))
    .style('stroke', '#F3F4F6')
    .style('stroke-dasharray', '3,3')

  // Y Axis Label
  svg
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#6B7280')
    .text('Amount ($)')
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const days = periodToDays[selectedPeriod.value]
    console.log('Fetching data for', days, 'days')
    await store.dispatch('fetchDailySalesData', { day: days })
    console.log('Chart data received:', chartData.value.length, 'items')
  } catch (err) {
    console.error('Failed to fetch daily sales data:', err)
  } finally {
    isLoading.value = false
    // Redraw chart after loading is complete
    setTimeout(() => {
      drawChart()
    }, 100)
  }
}

onMounted(async () => {
  await fetchData()
  window.addEventListener('resize', drawChart)
})

watch(selectedPeriod, async (newPeriod, oldPeriod) => {
  console.log('Period changed from', oldPeriod, 'to', newPeriod)
  await fetchData()
})

watch(selectedMetrics, () => {
  console.log('Metrics changed:', selectedMetrics.value)
  setTimeout(() => {
    drawChart()
  }, 50)
}, { deep: true })
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-800">Daily Sales</h2>
      <div class="flex gap-4 items-center">
        <!-- Metrics Selector -->
        <div class="flex gap-2 items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
          <button
            v-for="metric in availableMetrics"
            :key="metric"
            @click="toggleMetric(metric)"
            :disabled="isLoading"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              selectedMetrics.includes(metric)
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100',
              isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            {{ metric }}
          </button>
        </div>

        <!-- Period Selector -->
        <div class="relative">
          <select
            v-model="selectedPeriod"
            :disabled="isLoading"
            class="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
          >
            <option v-for="period in periods" :key="period" :value="period">
              {{ period }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="w-full h-[400px] flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div class="text-gray-500 text-sm">Loading chart data...</div>
      </div>
    </div>
    <div v-else-if="chartData.length === 0" class="w-full h-[400px] flex items-center justify-center">
      <div class="text-gray-500">No data available</div>
    </div>
    <div v-else ref="chartContainer" class="w-full relative"></div>

    <div class="flex justify-center items-center gap-6 mt-6">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#06B6D4]"></div>
        <span class="text-sm text-gray-600">Profit</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#6366F1]"></div>
        <span class="text-sm text-gray-600">FBA Amount</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#8B5CF6]"></div>
        <span class="text-sm text-gray-600">FBM Amount</span>
      </div>
    </div>

    <!-- SKU Table -->
    <SkuTable :selected-dates="selectedDates" @remove-date="handleRemoveDate" />
  </div>
</template>
