import { describe, it, expect, beforeEach, vi } from 'vitest'
import store from '../store'

describe('Vuex Store', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset store state
    store.commit('SET_ACCESS_TOKEN', null)
    store.commit('SET_USER_INFO', null)
    store.commit('SET_LOGIN_EMAIL', null)
    store.commit('SET_LOADING', false)
    store.commit('SET_ERROR', null)
    store.commit('SET_DAILY_SALES_DATA', [])
    vi.clearAllMocks()
  })

  describe('Mutations', () => {
    it('SET_ACCESS_TOKEN should update state and localStorage', () => {
      const token = 'test-token-123'
      store.commit('SET_ACCESS_TOKEN', token)

      expect(store.state.accessToken).toBe(token)
      expect(localStorage.getItem('accessToken')).toBe(token)
    })

    it('SET_ACCESS_TOKEN with null should remove from localStorage', () => {
      localStorage.setItem('accessToken', 'old-token')
      store.commit('SET_ACCESS_TOKEN', null)

      expect(store.state.accessToken).toBeNull()
      expect(localStorage.getItem('accessToken')).toBeNull()
    })

    it('SET_USER_INFO should update state and localStorage', () => {
      const userInfo = {
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }
      store.commit('SET_USER_INFO', userInfo)

      expect(store.state.userInfo).toEqual(userInfo)
      expect(JSON.parse(localStorage.getItem('userInfo') || '{}')).toEqual(userInfo)
    })

    it('SET_LOGIN_EMAIL should update state and localStorage', () => {
      const email = 'test@example.com'
      store.commit('SET_LOGIN_EMAIL', email)

      expect(store.state.loginEmail).toBe(email)
      expect(localStorage.getItem('loginEmail')).toBe(email)
    })

    it('SET_LOADING should update loading state', () => {
      store.commit('SET_LOADING', true)
      expect(store.state.isLoading).toBe(true)

      store.commit('SET_LOADING', false)
      expect(store.state.isLoading).toBe(false)
    })

    it('SET_ERROR should update error state', () => {
      const error = 'Test error message'
      store.commit('SET_ERROR', error)

      expect(store.state.error).toBe(error)
    })

    it('SET_DAILY_SALES_DATA should update daily sales data', () => {
      const salesData = [
        {
          date: '2025-01-01',
          profit: 100,
          fbaAmount: 200,
          fbmAmount: 150,
          fbaShippingAmount: 50,
          totalSales: 350,
        },
      ]
      store.commit('SET_DAILY_SALES_DATA', salesData)

      expect(store.state.dailySalesData).toEqual(salesData)
    })
  })

  describe('Getters', () => {
    it('isAuthenticated should return true when accessToken exists', () => {
      store.commit('SET_ACCESS_TOKEN', 'test-token')
      expect(store.getters.isAuthenticated).toBe(true)
    })

    it('isAuthenticated should return false when accessToken is null', () => {
      store.commit('SET_ACCESS_TOKEN', null)
      expect(store.getters.isAuthenticated).toBe(false)
    })
  })

  describe('Actions', () => {
    describe('login', () => {
      it('should login successfully and fetch user information', async () => {
        const mockTokenResponse = {
          ApiStatus: true,
          Data: {
            AccessToken: 'test-access-token',
            RefreshToken: 'test-refresh-token',
            TokenType: 'Bearer',
            ExpiresAt: '2025-12-31T23:59:59Z',
          },
        }

        const mockUserInfoResponse = {
          ApiStatus: true,
          Data: {
            user: {
              userId: '123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              accountStatus: 1,
              store: [
                {
                  storeId: 'store-123',
                  marketplaceName: 'Amazon US',
                  currency: 'USD',
                },
              ],
            },
          },
        }

        global.fetch = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockTokenResponse,
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockUserInfoResponse,
          })

        await store.dispatch('login', {
          email: 'test@example.com',
          password: 'password123',
        })

        expect(store.state.accessToken).toBe('test-access-token')
        expect(store.state.loginEmail).toBe('test@example.com')
        expect(store.state.userInfo).toBeDefined()
        expect(store.state.userInfo?.user.email).toBe('test@example.com')
      })

      it('should handle login failure', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
        })

        await expect(
          store.dispatch('login', {
            email: 'test@example.com',
            password: 'wrong-password',
          })
        ).rejects.toThrow('Login failed')

        expect(store.state.error).toBe('Login failed')
      })
    })

    describe('logout', () => {
      it('should clear user data and call logout API', async () => {
        store.commit('SET_ACCESS_TOKEN', 'test-token')
        store.commit('SET_USER_INFO', {
          user: { id: '123', email: 'test@example.com' },
        })
        store.commit('SET_LOGIN_EMAIL', 'test@example.com')

        global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

        await store.dispatch('logout')

        expect(store.state.accessToken).toBeNull()
        expect(store.state.userInfo).toBeNull()
        expect(store.state.loginEmail).toBeNull()
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/user/logout'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          })
        )
      })

      it('should clear user data even if API call fails', async () => {
        store.commit('SET_ACCESS_TOKEN', 'test-token')

        global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

        await store.dispatch('logout')

        expect(store.state.accessToken).toBeNull()
        expect(store.state.userInfo).toBeNull()
        expect(store.state.loginEmail).toBeNull()
      })
    })

    describe('fetchUserInformation', () => {
      it('should not fetch if accessToken or loginEmail is missing', async () => {
        global.fetch = vi.fn()

        await store.dispatch('fetchUserInformation')

        expect(fetch).not.toHaveBeenCalled()
      })

      it('should fetch and set user information successfully', async () => {
        store.commit('SET_ACCESS_TOKEN', 'test-token')
        store.commit('SET_LOGIN_EMAIL', 'test@example.com')

        const mockResponse = {
          ApiStatus: true,
          Data: {
            user: {
              userId: '123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              accountStatus: 1,
              store: [
                {
                  storeId: 'store-123',
                  marketplaceName: 'Amazon US',
                  currency: 'USD',
                },
              ],
            },
          },
        }

        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })

        await store.dispatch('fetchUserInformation')

        expect(store.state.userInfo).toBeDefined()
        expect(store.state.userInfo?.user.id).toBe('123')
        expect(store.state.userInfo?.user.email).toBe('test@example.com')
      })

      it('should handle API error', async () => {
        store.commit('SET_ACCESS_TOKEN', 'test-token')
        store.commit('SET_LOGIN_EMAIL', 'test@example.com')

        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            ApiStatusMessage: 'User not found',
          }),
        })

        await expect(store.dispatch('fetchUserInformation')).rejects.toThrow()
        expect(store.state.error).toBeDefined()
      })
    })

    describe('fetchDailySalesData', () => {
      it('should fetch and transform daily sales data', async () => {
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

        await store.dispatch('fetchDailySalesData', { day: 30 })

        expect(store.state.dailySalesData).toBeDefined()
        expect(Array.isArray(store.state.dailySalesData)).toBe(true)
      })

      it('should throw error if authentication or store info is missing', async () => {
        await expect(
          store.dispatch('fetchDailySalesData', { day: 30 })
        ).rejects.toThrow('Missing authentication or store information')
      })
    })
  })

  describe('State Persistence', () => {
    it('should persist accessToken to localStorage', () => {
      const token = 'persisted-token'
      store.commit('SET_ACCESS_TOKEN', token)

      expect(localStorage.getItem('accessToken')).toBe(token)
      expect(store.state.accessToken).toBe(token)
    })

    it('should persist userInfo to localStorage', () => {
      const userInfo = { user: { id: '123', email: 'test@example.com' } }
      store.commit('SET_USER_INFO', userInfo)

      expect(JSON.parse(localStorage.getItem('userInfo') || '{}')).toEqual(userInfo)
      expect(store.state.userInfo).toEqual(userInfo)
    })

    it('should persist loginEmail to localStorage', () => {
      const email = 'test@example.com'
      store.commit('SET_LOGIN_EMAIL', email)

      expect(localStorage.getItem('loginEmail')).toBe(email)
      expect(store.state.loginEmail).toBe(email)
    })
  })
})
