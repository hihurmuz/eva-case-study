<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useStore } from 'vuex'

interface Props {
  selectedDates: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'removeDate', date: string): void
}>()
const store = useStore()

const skuData = ref<any[]>([])
const refundRates = ref<Record<string, number>>({})
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const totalItems = ref(0)

const isDaysCompare = computed(() => props.selectedDates.length === 2)

const fetchSkuList = async (pageNum: number = 1) => {
  if (props.selectedDates.length === 0) return

  const userInfo = store.state.userInfo
  if (!userInfo?.user?.store) return

  isLoading.value = true

  try {
    const mockData = await import('../data/mockSkuData.json')
    const data = mockData.default

    console.log('SKU list API response (mock):', data)

    if (data.ApiStatus && data.Data?.skuList) {
      skuData.value = data.Data.skuList
      totalItems.value = data.Data.totalSize || data.Data.skuList.length

      await fetchRefundRates(data.Data.skuList.map((item: any) => item.sku))
    }
  } catch (err) {
    console.error('Failed to fetch SKU list:', err)
  } finally {
    isLoading.value = false
  }
}

const fetchRefundRates = async (skuList: string[]) => {
  if (skuList.length === 0) return

  try {
    const rates: Record<string, number> = {}
    skuList.forEach((sku) => {
      rates[sku] = Math.random() * 7.5 + 0.5
    })
    refundRates.value = rates

  } catch (err) {
    console.error('Failed to fetch refund rates:', err)
  }
}

const paginatedData = computed(() => {
  const start = ((currentPage.value - 1) * pageSize) % 30
  const end = start + pageSize
  return skuData.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))

const goToPage = (page: number) => {
  const needsNewFetch = Math.ceil((page * pageSize) / 30) !== Math.ceil((currentPage.value * pageSize) / 30)
  currentPage.value = page
  if (needsNewFetch) {
    fetchSkuList(page)
  }
}

const removeDate = (date: string) => {
  emit('removeDate', date)
}

watch(() => props.selectedDates, () => {
  currentPage.value = 1
  fetchSkuList()
}, { immediate: true, deep: true })
</script>

<template>
  <div v-if="selectedDates.length > 0" class="mt-8 bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">
        {{ isDaysCompare ? 'Sales Comparison' : 'Daily Sales Details' }}
      </h3>
      <div class="flex items-center gap-2">
        <span
          v-for="date in selectedDates"
          :key="date"
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-200"
        >
          {{ date }}
          <button
            @click="removeDate(date)"
            class="ml-1 hover:bg-indigo-100 rounded-full p-0.5 transition-colors"
            :aria-label="`Remove ${date}`"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-indigo-600 hover:text-indigo-800"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </span>
        <span v-if="isDaysCompare" class="text-sm text-gray-500 mx-1">vs</span>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="flex flex-col items-center gap-3">
        <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div class="text-gray-500 text-sm">Loading SKU data...</div>
      </div>
    </div>

    <div v-else-if="paginatedData.length === 0" class="text-center py-12 text-gray-500">
      No data available for selected date(s)
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
            <th v-if="!isDaysCompare" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ selectedDates[0] }}<br>
              <span class="text-xs font-normal">Sales / Units</span><br>
              <span class="text-xs font-normal">Avg. Selling Price</span>
            </th>
            <template v-else>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ selectedDates[0] }}<br>
                <span class="text-xs font-normal">Sales / Units</span><br>
                <span class="text-xs font-normal">Avg. Selling Price</span>
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ selectedDates[1] }}<br>
                <span class="text-xs font-normal">Sales / Units</span><br>
                <span class="text-xs font-normal">Avg. Selling Price</span>
              </th>
            </template>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU Refund Rate<br>
              <span class="text-xs font-normal">(Last 60 days)</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="item in paginatedData" :key="item.sku" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.sku }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ item.productName }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
              <div class="text-green-600 font-semibold">${{ item.amount?.toFixed(2) || '0.00' }} / {{ item.qty || 0 }}</div>
              <div class="text-gray-600">${{ item.amount && item.qty ? (item.amount / item.qty).toFixed(2) : '0.00' }}</div>
            </td>
            <td v-if="isDaysCompare" class="px-6 py-4 whitespace-nowrap text-sm text-right">
              <div class="text-green-600 font-semibold">${{ item.amount2?.toFixed(2) || '0.00' }} / {{ item.qty2 || 0 }}</div>
              <div class="text-gray-600">${{ item.amount2 && item.qty2 ? (item.amount2 / item.qty2).toFixed(2) : '0.00' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
              {{ (refundRates[item.sku] || 0).toFixed(2) }}%
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-700">
          Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} results
        </div>
        <div class="flex gap-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            v-for="page in Math.min(5, totalPages)"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-3 py-1 rounded border text-sm',
              currentPage === page
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
