import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import LoginForm from '../components/LoginForm.vue'
import Dashboard from '../views/Dashboard.vue'
import store from '../store'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: '/login' },
      { path: '/login', name: 'login', component: LoginForm },
      { path: '/dashboard', name: 'dashboard', component: Dashboard },
    ],
  })
}

describe('App', () => {
  let router: ReturnType<typeof createMockRouter>

  beforeEach(() => {
    router = createMockRouter()
    store.commit('SET_ACCESS_TOKEN', null)
    store.commit('SET_USER_INFO', null)
    store.commit('SET_LOGIN_EMAIL', null)
    vi.clearAllMocks()
  })

  const mountComponent = () => {
    return mount(App, {
      global: {
        plugins: [store, router],
        stubs: {
          LoginForm: true,
          Dashboard: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('should render router-view', () => {
      const wrapper = mountComponent()
      expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
    })

    it('should mount without errors', () => {
      expect(() => mountComponent()).not.toThrow()
    })
  })

  describe('Authentication Check on Mount', () => {
    it('should not fetch user info when not authenticated', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch')
      store.commit('SET_ACCESS_TOKEN', null)

      mountComponent()

      await vi.waitFor(() => {
        expect(dispatchSpy).not.toHaveBeenCalledWith('fetchUserInformation')
      })
    })

    it('should fetch user info when authenticated', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)
      store.commit('SET_ACCESS_TOKEN', 'test-token')

      mountComponent()

      await vi.waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith('fetchUserInformation')
      })
    })

    it('should redirect to dashboard if authenticated and on login page', async () => {
      store.commit('SET_ACCESS_TOKEN', 'test-token')
      vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)
      await router.push('/login')

      const pushSpy = vi.spyOn(router, 'push')

      mountComponent()

      await vi.waitFor(() => {
        expect(pushSpy).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should logout and redirect to login on fetch error', async () => {
      store.commit('SET_ACCESS_TOKEN', 'invalid-token')
      const dispatchSpy = vi
        .spyOn(store, 'dispatch')
        .mockRejectedValueOnce(new Error('Fetch failed'))
        .mockResolvedValueOnce(undefined)

      const pushSpy = vi.spyOn(router, 'push')

      mountComponent()

      await vi.waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith('logout')
        expect(pushSpy).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Integration', () => {
    it('should work with store and router', () => {
      const wrapper = mountComponent()

      expect((wrapper.vm as any).$store).toBeDefined()
      expect(wrapper.vm.$router).toBeDefined()
    })

    it('should provide router-view for child components', () => {
      const wrapper = mountComponent()

      const routerView = wrapper.findComponent({ name: 'RouterView' })
      expect(routerView.exists()).toBe(true)
    })
  })

  describe('Lifecycle', () => {
    it('should execute onMounted hook', async () => {
      const wrapper = mountComponent()

      await wrapper.vm.$nextTick()

      // Component should be mounted
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      store.commit('SET_ACCESS_TOKEN', 'test-token')
      vi.spyOn(store, 'dispatch').mockRejectedValue(new Error('Network error'))

      // Should not throw error
      expect(() => mountComponent()).not.toThrow()
    })

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      store.commit('SET_ACCESS_TOKEN', 'test-token')
      vi.spyOn(store, 'dispatch').mockRejectedValue(new Error('Test error'))

      mountComponent()

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
