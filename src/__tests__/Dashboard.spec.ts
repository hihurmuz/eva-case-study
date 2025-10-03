import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import ChartCard from '../components/ChartCard.vue'
import store from '../store'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/dashboard', component: Dashboard },
    ],
  })
}

describe('Dashboard', () => {
  let router: Router

  beforeEach(() => {
    router = createMockRouter()
    store.commit('SET_ACCESS_TOKEN', null)
    store.commit('SET_USER_INFO', null)
    store.commit('SET_LOGIN_EMAIL', null)
    store.commit('SET_LOADING', false)
    store.commit('SET_ERROR', null)
    vi.clearAllMocks()
  })

  const mountComponent = (userInfo?: any) => {
    if (userInfo) {
      store.commit('SET_USER_INFO', userInfo)
      store.commit('SET_LOGIN_EMAIL', userInfo.user.email)
    }

    return mount(Dashboard, {
      global: {
        plugins: [store, router],
        stubs: {
          ChartCard: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('should render dashboard with header and main content', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('header').exists()).toBe(true)
      expect(wrapper.find('main').exists()).toBe(true)
    })

    it('should display Eva logo in header', () => {
      const wrapper = mountComponent()

      const logo = wrapper.find('img[alt="Eva Logo"]')
      expect(logo.exists()).toBe(true)
      expect(logo.attributes('src')).toContain('eva-logo.svg')
    })

    it('should display logout button', () => {
      const wrapper = mountComponent()

      const logoutButton = wrapper.find('button')
      expect(logoutButton.exists()).toBe(true)
      expect(logoutButton.text()).toBe('Logout')
    })

    it('should display welcome message', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Welcome to Eva Dashboard!')
    })

    it('should render ChartCard component', () => {
      const wrapper = mountComponent()

      expect(wrapper.findComponent(ChartCard).exists()).toBe(true)
    })
  })

  describe('User Information Display', () => {
    it('should display user email when available', () => {
      const userInfo = {
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }
      const wrapper = mountComponent(userInfo)

      expect(wrapper.text()).toContain('Email: test@example.com')
    })

    it('should display user name when available', () => {
      const userInfo = {
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }
      const wrapper = mountComponent(userInfo)

      expect(wrapper.text()).toContain('Name: Test User')
    })

    it('should display user ID when available', () => {
      const userInfo = {
        user: {
          id: '123',
          email: 'test@example.com',
        },
      }
      const wrapper = mountComponent(userInfo)

      expect(wrapper.text()).toContain('User ID: 123')
    })

    it('should show N/A for email when userInfo is not available', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Email: N/A')
    })

    it('should not show name field when name is not available', () => {
      const userInfo = {
        user: {
          id: '123',
          email: 'test@example.com',
        },
      }
      const wrapper = mountComponent(userInfo)

      expect(wrapper.text()).not.toContain('Name:')
    })

    it('should display loginEmail if userInfo email is not available', () => {
      store.commit('SET_LOGIN_EMAIL', 'login@example.com')
      const wrapper = mount(Dashboard, {
        global: {
          plugins: [store, router],
          stubs: {
            ChartCard: true,
          },
        },
      })

      expect(wrapper.text()).toContain('Email: login@example.com')
    })
  })

  describe('Logout Functionality', () => {
    it('should call logout action when logout button is clicked', async () => {
      const wrapper = mountComponent()
      const dispatchSpy = vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)

      const logoutButton = wrapper.find('button')
      await logoutButton.trigger('click')

      expect(dispatchSpy).toHaveBeenCalledWith('logout')
    })

    it('should redirect to login page after logout', async () => {
      const wrapper = mountComponent()
      vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)
      const pushSpy = vi.spyOn(router, 'push')

      const logoutButton = wrapper.find('button')
      await logoutButton.trigger('click')

      await wrapper.vm.$nextTick()
      expect(pushSpy).toHaveBeenCalledWith('/login')
    })
  })

  describe('Layout and Styling', () => {
    it('should have proper layout classes', () => {
      const wrapper = mountComponent()

      const mainContainer = wrapper.find('.min-h-screen')
      expect(mainContainer.exists()).toBe(true)
      expect(mainContainer.classes()).toContain('bg-gray-50')
    })

    it('should have proper header styling', () => {
      const wrapper = mountComponent()

      const header = wrapper.find('header')
      expect(header.classes()).toContain('bg-white')
      expect(header.classes()).toContain('shadow-sm')
    })

    it('should have max-width container for content', () => {
      const wrapper = mountComponent()

      const container = wrapper.find('.max-w-7xl')
      expect(container.exists()).toBe(true)
      expect(container.classes()).toContain('mx-auto')
    })

    it('should have user info card with proper styling', () => {
      const wrapper = mountComponent()

      const userInfoCard = wrapper.find('.bg-gray-50.p-4.rounded-lg')
      expect(userInfoCard.exists()).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    it('should reactively update when userInfo changes', async () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Email: N/A')

      store.commit('SET_USER_INFO', {
        user: {
          id: '123',
          email: 'newemail@example.com',
          name: 'New User',
        },
      })

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Email: newemail@example.com')
      expect(wrapper.text()).toContain('Name: New User')
    })

    it('should reactively update when loginEmail changes', async () => {
      const wrapper = mountComponent()

      store.commit('SET_LOGIN_EMAIL', 'updated@example.com')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Email: updated@example.com')
    })
  })

  describe('Component Structure', () => {
    it('should have proper component hierarchy', () => {
      const wrapper = mountComponent()

      const mainElement = wrapper.find('main')
      const maxWidthContainer = mainElement.find('.max-w-7xl')
      expect(maxWidthContainer.exists()).toBe(true)

      const cards = maxWidthContainer.findAll('.bg-white')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should render user information section', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('User Information')
    })

    it('should have welcome section with proper styling', () => {
      const wrapper = mountComponent()

      const welcomeSection = wrapper.find('.text-2xl.font-bold.text-gray-800')
      expect(welcomeSection.exists()).toBe(true)
      expect(welcomeSection.text()).toContain('Welcome to Eva Dashboard!')
    })
  })
})
