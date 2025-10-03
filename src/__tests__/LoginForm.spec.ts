import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Store } from 'vuex'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import store from '../store'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
    ],
  })
}

describe('LoginForm', () => {
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

  const mountComponent = () => {
    return mount(LoginForm, {
      global: {
        plugins: [store, router],
      },
    })
  }

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('input[name="email"]').exists()).toBe(true)
      expect(wrapper.find('input[name="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Welcome back')
      expect(wrapper.text()).toContain('Please login to your account')
    })

    it('should render remember me checkbox', () => {
      const wrapper = mountComponent()

      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.exists()).toBe(true)
      expect(wrapper.text()).toContain('Remember My Password')
    })

    it('should render password visibility toggle', () => {
      const wrapper = mountComponent()

      const toggleButton = wrapper.find('.cursor-pointer')
      expect(toggleButton.exists()).toBe(true)
    })

    it('should show statistics balloons', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('$1.6B+')
      expect(wrapper.text()).toContain('Ad Spend Optimized')
      expect(wrapper.text()).toContain('$6B+')
      expect(wrapper.text()).toContain('Sales Generated')
      expect(wrapper.text()).toContain('51%')
      expect(wrapper.text()).toContain('Avg. Increase in Profitability')
    })
  })

  describe('Form Validation', () => {
    it('should show email required error when email is empty and touched', async () => {
      const wrapper = mountComponent()

      const emailInput = wrapper.find('input[name="email"]')
      await emailInput.trigger('blur')

      expect(wrapper.text()).toContain('E-mail is required')
    })

    it('should not show email error initially', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).not.toContain('E-mail is required')
    })

    it('should accept valid email input', async () => {
      const wrapper = mountComponent()

      const emailInput = wrapper.find('input[name="email"]')
      await emailInput.setValue('test@example.com')

      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com')
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when clicking eye icon', async () => {
      const wrapper = mountComponent()

      const passwordInput = wrapper.find('input[name="password"]')
      const toggleButton = wrapper.find('.cursor-pointer')

      expect((passwordInput.element as HTMLInputElement).type).toBe('password')

      await toggleButton.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('text')

      await toggleButton.trigger('click')
      expect((passwordInput.element as HTMLInputElement).type).toBe('password')
    })
  })

  describe('Login Functionality', () => {
    it('should call store login action on form submit with valid credentials', async () => {
      const wrapper = mountComponent()
      const dispatchSpy = vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)

      const emailInput = wrapper.find('input[name="email"]')
      const passwordInput = wrapper.find('input[name="password"]')
      const form = wrapper.find('form')

      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await form.trigger('submit')

      expect(dispatchSpy).toHaveBeenCalledWith('login', {
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should redirect to dashboard on successful login', async () => {
      const wrapper = mountComponent()
      vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)
      const pushSpy = vi.spyOn(router, 'push')

      const emailInput = wrapper.find('input[name="email"]')
      const passwordInput = wrapper.find('input[name="password"]')
      const form = wrapper.find('form')

      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await form.trigger('submit')

      await wrapper.vm.$nextTick()
      expect(pushSpy).toHaveBeenCalledWith('/dashboard')
    })

    it('should show error message on login failure', async () => {
      const wrapper = mountComponent()
      vi.spyOn(store, 'dispatch').mockRejectedValue(new Error('Login failed'))

      const emailInput = wrapper.find('input[name="email"]')
      const passwordInput = wrapper.find('input[name="password"]')
      const form = wrapper.find('form')

      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('wrongpassword')
      await form.trigger('submit')

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Login failed. Please check your credentials.')
    })

    it('should not submit form if email is empty', async () => {
      const wrapper = mountComponent()
      const dispatchSpy = vi.spyOn(store, 'dispatch')

      const form = wrapper.find('form')
      await form.trigger('submit')

      expect(dispatchSpy).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('E-mail is required')
    })

    it('should disable inputs and button while loading', async () => {
      const wrapper = mountComponent()
      store.commit('SET_LOADING', true)

      await wrapper.vm.$nextTick()

      const emailInput = wrapper.find('input[name="email"]')
      const passwordInput = wrapper.find('input[name="password"]')
      const submitButton = wrapper.find('button[type="submit"]')

      expect((emailInput.element as HTMLInputElement).disabled).toBe(true)
      expect((passwordInput.element as HTMLInputElement).disabled).toBe(true)
      expect((submitButton.element as HTMLButtonElement).disabled).toBe(true)
      expect(wrapper.text()).toContain('Logging in...')
    })

    it('should show store error if present', async () => {
      const wrapper = mountComponent()
      store.commit('SET_ERROR', 'Network error occurred')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Network error occurred')
    })
  })

  describe('Remember Me Functionality', () => {
    it('should toggle remember me checkbox', async () => {
      const wrapper = mountComponent()

      const checkbox = wrapper.find('input[type="checkbox"]')
      expect((checkbox.element as HTMLInputElement).checked).toBe(false)

      await checkbox.setValue(true)
      expect((checkbox.element as HTMLInputElement).checked).toBe(true)

      await checkbox.setValue(false)
      expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('UI State Management', () => {
    it('should clear login error when new login attempt is made', async () => {
      const wrapper = mountComponent()
      vi.spyOn(store, 'dispatch').mockRejectedValue(new Error('Login failed'))

      const emailInput = wrapper.find('input[name="email"]')
      const passwordInput = wrapper.find('input[name="password"]')
      const form = wrapper.find('form')

      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('wrongpassword')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Login failed. Please check your credentials.')

      vi.spyOn(store, 'dispatch').mockResolvedValue(undefined)
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()

      // Error should be cleared before new attempt
      expect(wrapper.text()).not.toContain('Login failed')
    })

    it('should mark email as touched on blur', async () => {
      const wrapper = mountComponent()

      const emailInput = wrapper.find('input[name="email"]')
      await emailInput.trigger('blur')

      // Email error should show after blur
      expect(wrapper.text()).toContain('E-mail is required')
    })
  })

  describe('Accessibility', () => {
    it('should have proper input types', () => {
      const wrapper = mountComponent()

      const emailInput = wrapper.find('input[name="email"]')
      const passwordInput = wrapper.find('input[name="password"]')

      expect((emailInput.element as HTMLInputElement).type).toBe('email')
      expect((passwordInput.element as HTMLInputElement).type).toBe('password')
    })

    it('should have autofocus on email input', () => {
      const wrapper = mountComponent()

      const emailInput = wrapper.find('input[name="email"]')
      expect(emailInput.attributes('autofocus')).toBeDefined()
    })

    it('should have proper placeholders', () => {
      const wrapper = mountComponent()

      const emailInput = wrapper.find('input[name="email"]')
      const passwordInput = wrapper.find('input[name="password"]')

      expect(emailInput.attributes('placeholder')).toBe('E-mail')
      expect(passwordInput.attributes('placeholder')).toBe('Password')
    })
  })
})
