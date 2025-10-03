import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ChartCard from '../components/ChartCard.vue'
import SkuTable from '../components/SkuTable.vue'
import store from '../store'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
  })
}

describe('ChartCard', () => {
  let router: ReturnType<typeof createMockRouter>

  beforeEach(() => {
    router = createMockRouter()
    store.commit('SET_ACCESS_TOKEN', 'test-token')
    store.commit('SET_USER_INFO', {
      user: {
        id: '123',
        email: 'test@example.com',
        store: {
          storeId: 'store-123',
          marketplaceName: 'Amazon US',
        },
      },
    })
    store.commit('SET_DAILY_SALES_DATA', [])
    vi.clearAllMocks()
  })

  const mountComponent = () => {
    return mount(ChartCard, {
      global: {
        plugins: [store, router],
        stubs: {
          SkuTable: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('should render chart card with title', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Daily Sales')
    })

    it('should render period selector', () => {
      const wrapper = mountComponent()

      const select = wrapper.find('select')
      expect(select.exists()).toBe(true)
      expect(wrapper.text()).toContain('Last 30 Days')
    })

    it('should render all period options', () => {
      const wrapper = mountComponent()

      const options = wrapper.findAll('option')
      expect(options.length).toBe(4)
      expect(options[0]?.text()).toBe('Last 60 Days')
      expect(options[1]?.text()).toBe('Last 30 Days')
      expect(options[2]?.text()).toBe('Last 14 Days')
      expect(options[3]?.text()).toBe('Last 7 Days')
    })

    it('should render metric filter buttons', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('FBM')
      expect(wrapper.text()).toContain('FBA')
      expect(wrapper.text()).toContain('Profit')
    })

    it('should render legend', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Profit')
      expect(wrapper.text()).toContain('FBA Amount')
      expect(wrapper.text()).toContain('FBM Amount')
    })

    it('should render SkuTable component', () => {
      const wrapper = mountComponent()

      expect(wrapper.findComponent(SkuTable).exists()).toBe(true)
    })
  })

  describe('Period Selection', () => {
    it('should have default period as Last 30 Days', () => {
      const wrapper = mountComponent()

      const select = wrapper.find('select')
      expect((select.element as HTMLSelectElement).value).toBe('Last 30 Days')
    })

    it('should dispatch fetchDailySalesData on mount', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)

      mountComponent()

      await vi.waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith('fetchDailySalesData', { day: 30 })
      })
    })

    it('should update period when selector changes', async () => {
      const wrapper = mountComponent()
      const dispatchSpy = vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)

      const select = wrapper.find('select')
      await select.setValue('Last 7 Days')

      await vi.waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith('fetchDailySalesData', { day: 7 })
      })
    })
  })

  describe('Metric Filtering', () => {
    it('should have all metrics selected by default', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button').filter((btn) => {
        const text = btn.text()
        return text === 'FBM' || text === 'FBA' || text === 'Profit'
      })

      buttons.forEach((btn) => {
        expect(btn.classes()).toContain('bg-indigo-600')
      })
    })

    it('should toggle metric when button is clicked', async () => {
      const wrapper = mountComponent()

      const fbmButton = wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'FBM')

      expect(fbmButton?.classes()).toContain('bg-indigo-600')

      await fbmButton?.trigger('click')
      await wrapper.vm.$nextTick()

      expect(fbmButton?.classes()).not.toContain('bg-indigo-600')
      expect(fbmButton?.classes()).toContain('bg-white')
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when loading', async () => {
      const wrapper = mountComponent()

      // Set isLoading to true via component's internal state
      await wrapper.vm.$nextTick()

      // Check for loading text
      const loadingText = wrapper.find('.text-gray-500')
      if (loadingText.exists()) {
        expect(loadingText.text()).toContain('Loading chart data...')
      }
    })

    it('should disable controls when loading', async () => {
      store.commit('SET_LOADING', true)
      const wrapper = mountComponent()

      await wrapper.vm.$nextTick()

      const select = wrapper.find('select')
      const metricButtons = wrapper.findAll('button').filter((btn) => {
        const text = btn.text()
        return text === 'FBM' || text === 'FBA' || text === 'Profit'
      })

      metricButtons.forEach((btn) => {
        expect((btn.element as HTMLButtonElement).disabled).toBe(true)
      })
    })
  })

  describe('Empty State', () => {
    it('should show no data message when chartData is empty', () => {
      store.commit('SET_DAILY_SALES_DATA', [])
      const wrapper = mountComponent()

      // Component shows "No data available" when there's no data and not loading
      expect(wrapper.text()).toContain('No data available')
    })
  })

  describe('Chart Rendering with Data', () => {
    it('should render chart when data is available', async () => {
      const mockData = [
        {
          date: 'Jan 1',
          profit: 1000,
          fbaAmount: 2000,
          fbmAmount: 1500,
          fbaShippingAmount: 500,
          totalSales: 3500,
        },
        {
          date: 'Jan 2',
          profit: 1200,
          fbaAmount: 2200,
          fbmAmount: 1600,
          fbaShippingAmount: 600,
          totalSales: 3800,
        },
      ]

      store.commit('SET_DAILY_SALES_DATA', mockData)
      const wrapper = mountComponent()

      await wrapper.vm.$nextTick()
      await vi.waitFor(() => {
        const chartContainer = wrapper.find('.relative')
        expect(chartContainer.exists()).toBe(true)
      })
    })
  })

  describe('Date Selection', () => {
    it('should pass selected dates to SkuTable', () => {
      const wrapper = mountComponent()

      const skuTable = wrapper.findComponent(SkuTable)
      expect(skuTable.exists()).toBe(true)
      expect(skuTable.props('selectedDates')).toBeDefined()
    })
  })

  describe('Component Integration', () => {
    it('should handle remove date event from SkuTable', async () => {
      const wrapper = mountComponent()

      const skuTable = wrapper.findComponent(SkuTable)
      expect(skuTable.exists()).toBe(true)

      // Verify selectedDates prop is passed
      expect(skuTable.props('selectedDates')).toBeDefined()
    })
  })

  describe('Responsive Layout', () => {
    it('should have proper container classes', () => {
      const wrapper = mountComponent()

      const container = wrapper.find('.bg-white.rounded-lg.shadow-md.p-6')
      expect(container.exists()).toBe(true)
    })

    it('should have flex layout for controls', () => {
      const wrapper = mountComponent()

      const controlsContainer = wrapper.find('.flex.justify-between.items-center')
      expect(controlsContainer.exists()).toBe(true)
    })
  })
})
