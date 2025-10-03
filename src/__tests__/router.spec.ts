import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import type { Router } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import Dashboard from '../views/Dashboard.vue'
import store from '../store'

describe('Router', () => {
  let router: Router

  beforeEach(() => {
    // Create a new router instance for each test
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          redirect: '/login',
        },
        {
          path: '/login',
          name: 'login',
          component: LoginForm,
          meta: { requiresGuest: true },
        },
        {
          path: '/dashboard',
          name: 'dashboard',
          component: Dashboard,
          meta: { requiresAuth: true },
        },
      ],
    })

    // Setup navigation guard
    router.beforeEach((to, from, next) => {
      const isAuthenticated = store.getters.isAuthenticated

      if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
      } else if (to.meta.requiresGuest && isAuthenticated) {
        next('/dashboard')
      } else {
        next()
      }
    })

    // Clear store state
    store.commit('SET_ACCESS_TOKEN', null)
    store.commit('SET_USER_INFO', null)
    store.commit('SET_LOGIN_EMAIL', null)

    vi.clearAllMocks()
  })

  describe('Route Configuration', () => {
    it('should have login route', () => {
      const loginRoute = router.resolve({ name: 'login' })
      expect(loginRoute.path).toBe('/login')
    })

    it('should have dashboard route', () => {
      const dashboardRoute = router.resolve({ name: 'dashboard' })
      expect(dashboardRoute.path).toBe('/dashboard')
    })

    it('should redirect root to login', async () => {
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  describe('Route Meta', () => {
    it('should have requiresGuest meta on login route', () => {
      const loginRoute = router.resolve({ name: 'login' })
      expect(loginRoute.meta.requiresGuest).toBe(true)
    })

    it('should have requiresAuth meta on dashboard route', () => {
      const dashboardRoute = router.resolve({ name: 'dashboard' })
      expect(dashboardRoute.meta.requiresAuth).toBe(true)
    })
  })

  describe('Navigation Guards - Unauthenticated User', () => {
    beforeEach(() => {
      store.commit('SET_ACCESS_TOKEN', null)
    })

    it('should allow unauthenticated user to access login', async () => {
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should redirect unauthenticated user from dashboard to login', async () => {
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should redirect root to login for unauthenticated user', async () => {
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  describe('Navigation Guards - Authenticated User', () => {
    beforeEach(() => {
      store.commit('SET_ACCESS_TOKEN', 'test-token')
    })

    it('should redirect authenticated user from login to dashboard', async () => {
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('should allow authenticated user to access dashboard', async () => {
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('should redirect root to dashboard for authenticated user', async () => {
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })
  })

  describe('Navigation Flow', () => {
    it('should navigate from login to dashboard after authentication', async () => {
      // Start at login
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/login')

      // Authenticate
      store.commit('SET_ACCESS_TOKEN', 'test-token')

      // Navigate to dashboard
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('should navigate from dashboard to login after logout', async () => {
      // Authenticate first
      store.commit('SET_ACCESS_TOKEN', 'test-token')

      // Go to dashboard
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/dashboard')

      // Logout
      store.commit('SET_ACCESS_TOKEN', null)

      // Try to access dashboard
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  describe('Route Components', () => {
    it('should load LoginForm component for login route', () => {
      const loginRoute = router.resolve({ name: 'login' })
      expect(loginRoute.matched[0].components?.default).toBe(LoginForm)
    })

    it('should load Dashboard component for dashboard route', () => {
      const dashboardRoute = router.resolve({ name: 'dashboard' })
      expect(dashboardRoute.matched[0].components?.default).toBe(Dashboard)
    })
  })

  describe('Route Names', () => {
    it('should resolve login route by name', () => {
      const route = router.resolve({ name: 'login' })
      expect(route.name).toBe('login')
    })

    it('should resolve dashboard route by name', () => {
      const route = router.resolve({ name: 'dashboard' })
      expect(route.name).toBe('dashboard')
    })
  })

  describe('Invalid Routes', () => {
    it('should handle non-existent routes', async () => {
      await router.push('/non-existent')
      // Should stay on current route or redirect
      expect(router.currentRoute.value.path).toBeDefined()
    })
  })

  describe('Authentication State Changes', () => {
    it('should respect authentication state in guard', async () => {
      // Unauthenticated - should redirect to login
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/login')

      // Authenticate
      store.commit('SET_ACCESS_TOKEN', 'test-token')

      // Now should access dashboard
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/dashboard')

      // Clear auth
      store.commit('SET_ACCESS_TOKEN', null)

      // Should redirect back to login
      await router.push('/dashboard')
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should check store getter for authentication', async () => {
      const getterSpy = vi.spyOn(store.getters, 'isAuthenticated', 'get')

      await router.push('/dashboard')

      expect(getterSpy).toHaveBeenCalled()
    })
  })

  describe('Guard Behavior', () => {
    it('should not allow authenticated user on guest routes', async () => {
      store.commit('SET_ACCESS_TOKEN', 'test-token')

      await router.push('/login')

      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('should not allow unauthenticated user on protected routes', async () => {
      store.commit('SET_ACCESS_TOKEN', null)

      await router.push('/dashboard')

      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  describe('Multiple Navigation', () => {
    it('should handle multiple navigation attempts correctly', async () => {
      // Navigate to login
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/login')

      // Navigate to root
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/login')

      // Authenticate
      store.commit('SET_ACCESS_TOKEN', 'test-token')

      // Navigate to login (should redirect to dashboard)
      await router.push('/login')
      expect(router.currentRoute.value.path).toBe('/dashboard')

      // Navigate to root (should redirect to dashboard)
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })
  })
})
