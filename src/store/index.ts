import { createStore } from 'vuex'

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  refresh_token?: string
}

interface UserInformation {
  user: {
    id: string
    email: string
    name?: string
  }
}

interface State {
  accessToken: string | null
  userInfo: UserInformation | null
  loginEmail: string | null
  isLoading: boolean
  error: string | null
}

export default createStore<State>({
  state: {
    accessToken: localStorage.getItem('accessToken'),
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    loginEmail: localStorage.getItem('loginEmail'),
    isLoading: false,
    error: null,
  },
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },
  mutations: {
    SET_ACCESS_TOKEN(state, token: string | null) {
      state.accessToken = token
      if (token) {
        localStorage.setItem('accessToken', token)
      } else {
        localStorage.removeItem('accessToken')
      }
    },
    SET_USER_INFO(state, userInfo: UserInformation | null) {
      state.userInfo = userInfo
      if (userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      } else {
        localStorage.removeItem('userInfo')
      }
    },
    SET_LOGIN_EMAIL(state, email: string | null) {
      state.loginEmail = email
      if (email) {
        localStorage.setItem('loginEmail', email)
      } else {
        localStorage.removeItem('loginEmail')
      }
    },
    SET_LOADING(state, isLoading: boolean) {
      state.isLoading = isLoading
    },
    SET_ERROR(state, error: string | null) {
      state.error = error
    },
  },
  actions: {
    async login({ commit }, { email, password }: { email: string; password: string }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)

      try {
        const response = await fetch('https://iapitest.eva.guru/oauth/token', {
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
        commit('SET_ACCESS_TOKEN', data.access_token)
        commit('SET_LOGIN_EMAIL', email)

        await this.dispatch('fetchUserInformation')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        commit('SET_ERROR', errorMessage)
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchUserInformation({ commit, state }) {
      if (!state.accessToken) return

      try {
        const response = await fetch('https://iapitest.eva.guru/user/user-information', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user information')
        }

        const data: UserInformation = await response.json()
        commit('SET_USER_INFO', data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        commit('SET_ERROR', errorMessage)
        throw err
      }
    },

    logout({ commit }) {
      commit('SET_ACCESS_TOKEN', null)
      commit('SET_USER_INFO', null)
      commit('SET_LOGIN_EMAIL', null)
    },
  },
})
