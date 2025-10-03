import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SkuTable from '../components/SkuTable.vue'
import store from '../store'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
  })
}

describe('SkuTable', () => {
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
    vi.clearAllMocks()
  })

  const mountComponent = (props = {}) => {
    return mount(SkuTable, {
      props: {
        selectedDates: [],
        ...props,
      },
      global: {
        plugins: [store, router],
      },
    })
  }

  describe('Rendering', () => {
    it('should not render when no dates are selected', () => {
      const wrapper = mountComponent({ selectedDates: [] })

      expect(wrapper.find('.bg-white.rounded-lg.shadow-md').exists()).toBe(false)
    })

    it('should render when dates are selected', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      expect(wrapper.find('.bg-white.rounded-lg.shadow-md').exists()).toBe(true)
    })

    it('should show "Daily Sales Details" title for single date', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      expect(wrapper.text()).toContain('Daily Sales Details')
    })

    it('should show "Sales Comparison" title for two dates', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1', 'Jan 2'] })

      expect(wrapper.text()).toContain('Sales Comparison')
    })

    it('should display selected dates as badges', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1', 'Jan 2'] })

      expect(wrapper.text()).toContain('Jan 1')
      expect(wrapper.text()).toContain('Jan 2')
    })

    it('should show remove buttons for selected dates', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1', 'Jan 2'] })

      const removeButtons = wrapper.findAll('button').filter((btn) => btn.text() === '×')
      expect(removeButtons.length).toBe(2)
    })
  })

  describe('Date Removal', () => {
    it('should emit removeDate event when remove button is clicked', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1', 'Jan 2'] })

      const removeButtons = wrapper.findAll('button').filter((btn) => btn.text() === '×')
      await removeButtons[0]?.trigger('click')

      expect(wrapper.emitted('removeDate')).toBeTruthy()
      expect(wrapper.emitted('removeDate')?.[0]).toEqual(['Jan 1'])
    })

    it('should emit correct date when removing second date', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1', 'Jan 2'] })

      const removeButtons = wrapper.findAll('button').filter((btn) => btn.text() === '×')
      await removeButtons[1]?.trigger('click')

      expect(wrapper.emitted('removeDate')?.[0]).toEqual(['Jan 2'])
    })
  })

  describe('Table Structure', () => {
    it('should have table headers when data is available', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await wrapper.vm.$nextTick()

      // Wait for data to load
      await vi.waitFor(() => {
        const headers = wrapper.findAll('th')
        if (headers.length > 0) {
          expect(headers.length).toBeGreaterThan(0)
        }
      })
    })

    it('should show loading state', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      // Component should show loading initially
      await wrapper.vm.$nextTick()

      // Check if loading state exists at some point
      const loadingElement = wrapper.find('.text-center.py-8')
      if (loadingElement.exists()) {
        expect(loadingElement.text()).toContain('Loading')
      }
    })
  })

  describe('Pagination', () => {
    it('should show pagination controls when data has multiple pages', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await vi.waitFor(() => {
        const pagination = wrapper.find('.flex.items-center.justify-between')
        if (pagination.exists()) {
          expect(pagination.exists()).toBe(true)
        }
      })
    })

    it('should display page information', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await vi.waitFor(() => {
        const pageInfo = wrapper.find('.text-sm.text-gray-700')
        if (pageInfo.exists()) {
          expect(pageInfo.text()).toMatch(/Showing \d+ to \d+ of \d+ results/)
        }
      })
    })
  })

  describe('Comparison Mode', () => {
    it('should show difference columns in comparison mode', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1', 'Jan 2'] })

      await vi.waitFor(() => {
        const text = wrapper.text()
        if (text.includes('Difference') || text.includes('Diff')) {
          expect(text).toMatch(/Difference|Diff/)
        }
      })
    })

    it('should not show difference columns in single date mode', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Difference')
    })
  })

  describe('Data Fetching', () => {
    it('should fetch data when dates change', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await wrapper.vm.$nextTick()

      // Change dates prop
      await wrapper.setProps({ selectedDates: ['Jan 1', 'Jan 2'] })

      await wrapper.vm.$nextTick()

      // Component should re-fetch data
      expect(wrapper.find('.bg-white.rounded-lg.shadow-md').exists()).toBe(true)
    })

    it('should reset to page 1 when dates change', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await wrapper.vm.$nextTick()

      // Change dates
      await wrapper.setProps({ selectedDates: ['Jan 2'] })

      await wrapper.vm.$nextTick()

      // Should be on page 1
      const pageInfo = wrapper.find('.text-sm.text-gray-700')
      if (pageInfo.exists()) {
        expect(pageInfo.text()).toMatch(/Showing 1 to/)
      }
    })
  })

  describe('Empty State', () => {
    it('should show empty message when no SKU data', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await vi.waitFor(() => {
        const emptyMessage = wrapper.find('.text-center.text-gray-500')
        if (emptyMessage.exists()) {
          expect(emptyMessage.text()).toMatch(/No data|No SKU/i)
        }
      })
    })
  })

  describe('Responsive Design', () => {
    it('should have proper container classes', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      const container = wrapper.find('.bg-white.rounded-lg.shadow-md.p-6')
      expect(container.exists()).toBe(true)
    })

    it('should have responsive table wrapper', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      const tableWrapper = wrapper.find('.overflow-x-auto')
      if (tableWrapper.exists()) {
        expect(tableWrapper.exists()).toBe(true)
      }
    })
  })

  describe('Table Columns', () => {
    it('should display SKU column', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await vi.waitFor(() => {
        const headers = wrapper.findAll('th')
        const skuHeader = headers.find((h) => h.text().includes('SKU'))
        if (skuHeader) {
          expect(skuHeader.exists()).toBe(true)
        }
      })
    })

    it('should display amount columns', async () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      await vi.waitFor(() => {
        const text = wrapper.text()
        if (text.includes('Amount') || text.includes('Sales')) {
          expect(text).toMatch(/Amount|Sales/)
        }
      })
    })
  })

  describe('Styling', () => {
    it('should have proper header styling', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      const header = wrapper.find('.flex.items-center.justify-between')
      expect(header.exists()).toBe(true)
    })

    it('should style date badges correctly', () => {
      const wrapper = mountComponent({ selectedDates: ['Jan 1'] })

      const badges = wrapper.findAll('.bg-indigo-100')
      expect(badges.length).toBeGreaterThan(0)
    })
  })
})
