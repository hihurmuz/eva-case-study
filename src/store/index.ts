import { createStore } from 'vuex'
import type { ActionContext } from 'vuex'

const baseUrl = 'https://iapitest.eva.guru'

interface TokenResponse {
  ApiStatus: boolean
  ApiStatusCode: number
  ApiStatusMessage: string
  Data: {
    AccessToken: string
    RefreshToken: string
    TokenType: string
    ExpiresAt: string
  }
}

interface UserInformation {
  user: {
    id: string
    email: string
    name?: string
    currency?: string
    membershipsSystemStatus?: string
    store?: {
      storeId: string
      marketplaceName: string
    }
  }
}

interface DailySalesData {
  date: string
  profit: number
  fbaAmount: number
  fbmAmount: number
  fbaShippingAmount: number
  totalSales: number
}

interface State {
  accessToken: string | null
  userInfo: UserInformation | null
  loginEmail: string | null
  isLoading: boolean
  error: string | null
  dailySalesData: DailySalesData[]
}

const store = createStore<State>({
  state: {
    accessToken: localStorage.getItem('accessToken'),
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    loginEmail: localStorage.getItem('loginEmail'),
    isLoading: false,
    error: null,
    dailySalesData: [],
  },
  getters: {
    isAuthenticated: (state: State) => !!state.accessToken,
  },
  mutations: {
    SET_ACCESS_TOKEN(state: State, token: string | null) {
      state.accessToken = token
      if (token) {
        localStorage.setItem('accessToken', token)
      } else {
        localStorage.removeItem('accessToken')
      }
    },
    SET_USER_INFO(state: State, userInfo: UserInformation | null) {
      state.userInfo = userInfo
      if (userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      } else {
        localStorage.removeItem('userInfo')
      }
    },
    SET_LOGIN_EMAIL(state: State, email: string | null) {
      state.loginEmail = email
      if (email) {
        localStorage.setItem('loginEmail', email)
      } else {
        localStorage.removeItem('loginEmail')
      }
    },
    SET_LOADING(state: State, isLoading: boolean) {
      state.isLoading = isLoading
    },
    SET_ERROR(state: State, error: string | null) {
      state.error = error
    },
    SET_DAILY_SALES_DATA(state: State, data: DailySalesData[]) {
      state.dailySalesData = data
    },
  },
  actions: {
    async login({ commit }: ActionContext<State, State>, { email, password }: { email: string; password: string }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)

      try {
        const response = await fetch(`${baseUrl}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Email: email,
            Password: password,
            GrantType: 'password',
            Scope: 'amazon_data',
            ClientId: 'C0001',
            ClientSecret: 'SECRET0001',
            RedirectUri: 'https://api.eva.guru',
          }),
        })

        if (!response.ok) {
          throw new Error('Login failed')
        }

        const data: TokenResponse = await response.json()
        commit('SET_ACCESS_TOKEN', data.Data.AccessToken)
        commit('SET_LOGIN_EMAIL', email)

        try {
          await store.dispatch('fetchUserInformation')
        } catch (userInfoErr) {
          console.warn('Failed to fetch user information:', userInfoErr)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        commit('SET_ERROR', errorMessage)
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchUserInformation({ commit, state }: ActionContext<State, State>) {
      if (!state.accessToken || !state.loginEmail) return

      try {
        const response = await fetch(`${baseUrl}/user/user-information`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: state.loginEmail,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('User information API error:', errorData)
          throw new Error(errorData.ApiStatusMessage || 'Failed to fetch user information')
        }

        const data = await response.json()

        if (!data.ApiStatus) {
          throw new Error(data.ApiStatusMessage || 'Failed to fetch user information')
        }

        const userData = data.Data.user
        const firstStore = userData.store && userData.store.length > 0 ? userData.store[0] : null

        const userInfo: UserInformation = {
          user: {
            id: userData.userId || '',
            email: userData.email || state.loginEmail || '',
            name: userData.firstName && userData.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : userData.firstName || userData.lastName,
            currency: firstStore?.currency,
            membershipsSystemStatus: userData.accountStatus?.toString(),
            store: firstStore ? {
              storeId: firstStore.storeId,
              marketplaceName: firstStore.marketplaceName
            } : undefined
          }
        }

        console.log('Processed userInfo:', userInfo)
        commit('SET_USER_INFO', userInfo)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        commit('SET_ERROR', errorMessage)
        console.error('fetchUserInformation error:', err)
        throw err
      }
    },

    async logout({ commit, state }: ActionContext<State, State>) {
      if (state.accessToken) {
        try {
          await fetch(`${baseUrl}/user/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${state.accessToken}`,
              'Content-Type': 'application/json',
            },
          })
        } catch (err) {
          console.warn('Logout API call failed:', err)
        }
      }

      commit('SET_ACCESS_TOKEN', null)
      commit('SET_USER_INFO', null)
      commit('SET_LOGIN_EMAIL', null)
    },

    async fetchDailySalesData({ commit, state }: ActionContext<State, State>, { day }: { day: number }) {
      if (!state.accessToken || !state.userInfo?.user?.store) {
        throw new Error('Missing authentication or store information')
      }

      try {
        const mockData = await import('../data/mockSalesData.json')
        const data = mockData.default

        console.log('Daily sales API response (mock):', data)

        // Filter data based on selected day range
        const allItems = data.Data.item
        const totalItems = allItems.length
        const startIndex = Math.max(0, totalItems - day)
        const filteredItems = allItems.slice(startIndex)

        console.log(`Filtering ${day} days from ${totalItems} total items:`, filteredItems.length)

        // Transform API response to our chart format
        const transformedData: DailySalesData[] = filteredItems.map((item: {
          date: string
          profit?: number
          fbaAmount?: number
          fbmAmount?: number
          fbaShippingAmount?: number
        }) => {
          const dateObj = new Date(item.date)
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })

          const fbaAmount = item.fbaAmount || 0
          const fbmAmount = item.fbmAmount || 0

          return {
            date: formattedDate,
            profit: item.profit || 0,
            fbaAmount: fbaAmount,
            fbmAmount: fbmAmount,
            fbaShippingAmount: item.fbaShippingAmount || 0,
            totalSales: fbaAmount + fbmAmount,
          }
        })

        console.log('Transformed chart data:', transformedData)
        commit('SET_DAILY_SALES_DATA', transformedData)

        const { storeId, marketplaceName } = state.userInfo.user.store

        const response = await fetch(`${baseUrl}/data/daily-sales-overview`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marketplace: marketplaceName,
            sellerId: storeId,
            requestStatus: 0,
            day: day,
            excludeYoYData: true,
            customDateData: null,
          }),
        })


      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        commit('SET_ERROR', errorMessage)
        throw err
      }
    },
  },
})

export default store
