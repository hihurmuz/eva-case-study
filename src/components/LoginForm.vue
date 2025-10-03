<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import dashboardImage from '../assets/images/dashboard.png'
import checkComputer from '../assets/images/check-computer.svg'
import growthChart from '../assets/images/growth-chart.svg'
import helpIncrease from '../assets/images/help-increas.svg'

const store = useStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const loginError = ref<string | null>(null)
const emailTouched = ref(false)

const isLoading = computed(() => store.state.isLoading)
const storeError = computed(() => store.state.error)

const handleLogin = async () => {
  loginError.value = null
  emailTouched.value = true

  if (!email.value) {
    return
  }

  try {
    await store.dispatch('login', { email: email.value, password: password.value })
    await router.push('/dashboard')
  } catch (err) {
    console.error('Login error:', err)
    loginError.value = 'Login failed. Please check your credentials.'
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleEmailBlur = () => {
  emailTouched.value = true
}
</script>

<template>
  <div class="flex min-h-screen">
    <div class="w-full lg:w-1/3 bg-[#0E1113] flex items-center justify-center px-12">
      <div class="login-form">
        <div class="flex flex-col justify-center 2xl:px-8 [@media(min-width:1600px)]:px-12 [@media(min-width:2000px)]:px-20">
          <div class="flex flex-col justify-center gap-4 mb-[46px]">
            <span class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-[44px] font-semibold text-white">Welcome back</span>
            <span class="text-xl font-light text-[#CECECE]">Please login to your account</span>
          </div>

          <form @submit.prevent="handleLogin" class="flex flex-col items-start gap-8 w-full mb-[34px]">
            <div v-if="loginError || storeError" class="w-full">
              <div class="p-4 w-full bg-red-400 border border-red-600 text-red-700 rounded relative flex gap-2 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white h-6 w-6">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="text-white">{{ loginError || storeError }}</span>
              </div>
            </div>

            <div class="w-full">
              <div class="relative z-0">
                <input
                  type="email"
                  name="email"
                  v-model="email"
                  placeholder="E-mail"
                  autofocus
                  @blur="handleEmailBlur"
                  :disabled="isLoading"
                  class="autofill-inputs block py-2.5 px-2 w-full text-[16px] bg-transparent border-0 border-b-[1px] border-[#a9a9a9] focus:outline-none focus:ring-0 text-[#cecece] placeholder-[#cecece]"
                />
              </div>
              <span v-if="emailTouched && !email" class="text-red-500" style="font-size: 12px;">E-mail is required</span>
            </div>

            <div class="w-full">
              <div class="relative">
                <input
                  name="password"
                  v-model="password"
                  placeholder="Password"
                  :type="showPassword ? 'text' : 'password'"
                  :disabled="isLoading"
                  class="autofill-inputs block py-2.5 px-2 w-full text-[16px] bg-transparent border-0 border-b-[1px] border-[#a9a9a9] focus:outline-none focus:ring-0 text-[#cecece] placeholder-[#cecece]"
                />
                <a @click="togglePasswordVisibility" class="absolute right-0 top-0 mt-4 mr-4 cursor-pointer">
                  <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500 h-6 w-6">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500 h-6 w-6">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </a>
              </div>
            </div>

            <div class="flex w-full justify-between items-center gap-y-2">
              <label class="flex items-center text-[12px] lg:text-[10px] 2xl:text-[14px] text-[#CECECE] cursor-pointer">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="mr-2 w-4 h-4 rounded border-2 border-[#b4b4b4] bg-transparent"
                />
                <span>Remember My Password</span>
              </label>
              <a href="#" class="text-[12px] lg:text-[10px] 2xl:text-[14px]" style="color: rgb(126, 119, 233) !important;">Forgot Your Password?</a>
            </div>

            <div class="flex flex-wrap justify-center pb-2 w-full">
              <button
                type="submit"
                :disabled="isLoading"
                class="flex justify-center items-center gap-[7px] min-w-[170px] min-h-[45px] py-3 px-7 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-sm hover:bg-[#9A95DBFF] active:bg-[#37097BFF] focus-visible:outline-[#388BFF] cursor-pointer text-white bg-[#6500fe] disabled:opacity-50"
              >
                <span class="text-[18px] mx-auto">{{ isLoading ? 'Logging in...' : 'Login' }}</span>
              </button>
            </div>
          </form>

          <div class="w-full rounded-md p-4 text-[16px] bg-[#21272C] text-[#F3F3F3]">
            Don't have an account?
            <a href="#" class="font-bold" style="color: rgb(126, 119, 233) !important;">Create your Eva account.</a>
            Instantly experience success on Amazon.
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side - Dashboard Preview -->
    <div class="hidden lg:flex lg:flex-col lg:w-2/3 bg-[#6C59FE] pl-8 lg:pl-20 justify-end gap-8 pb-0">
      <!-- Top Text -->
      <div class="place-self-end w-[90%]">
        <div class="flex flex-col gap-4 max-w-[60%] xl:max-w-[60%]">
          <h2 class="lg:text-3xl xl:text-[36px] xl:leading-[40px] text-white font-semibold max-w-[600px]">
            Become Better Equipped To Grow Your Business On Amazon
          </h2>
          <p class="text-[16px] text-[#DFDFDF] max-w-[550px]">
            Dominate your competition, increase sales & drive business growth using a combination of Eva's Amazon management services, market expertise and powerful optimization software.
          </p>
        </div>
      </div>

      <div class="relative place-self-end w-[90%] flex">
        <div
          class="balloon rounded-full p-4 aspect-square absolute -top-[1%] lg:right-[10%] xl:right-[15%] 2xl:right-[20%] flex items-center justify-center text-white w-[140px] h-[140px] xl:w-[150px] xl:h-[150px] 2xl:w-[204px] 2xl:h-[204px] bg-white/15 backdrop-blur-md shadow-2xl"
          style="transform: translateY(-80%);"
        >
          <div class="flex flex-col items-center justify-center text-center gap-2 2xl:gap-4">
            <img :src="checkComputer" alt="check-computer" class="w-10 h-10 2xl:w-[40px] 2xl:h-[40px]" />
            <span class="font-semibold lg:text-2xl xl:text-3xl 2xl:text-[40px] 2xl:mt-2">$1.6B+</span>
            <span class="lg:text-base xl:text-lg 2xl:text-[15px]">Ad Spend Optimized</span>
          </div>
        </div>

        <!-- Balloon 2 - Top Left ($6B+) -->
        <div
          class="balloon rounded-full p-4 aspect-square absolute -left-[.5%] -top-[4%] flex items-center justify-center text-white w-[140px] h-[140px] xl:w-[150px] xl:h-[150px] 2xl:w-[10.5vw] 2xl:h-[10.5vw] bg-white/15 backdrop-blur-md shadow-2xl"
          style="transform: translateX(-70%);"
        >
          <div class="flex flex-col items-center justify-center text-center gap-2">
            <img :src="growthChart" alt="growth-chart" class="w-10 h-10 2xl:w-[41px] 2xl:h-[41px]" />
            <span class="font-semibold lg:text-2xl xl:text-3xl 2xl:text-[40px]">$6B+</span>
            <span class="lg:text-base xl:text-lg 2xl:text-[15px]">Sales Generated</span>
          </div>
        </div>

        <div
          class="balloon rounded-full p-4 aspect-square absolute left-[3%] bottom-[10%] xl:bottom-[15%] 2xl:bottom-[19.5%] flex items-center justify-center text-white w-[140px] h-[140px] xl:w-[150px] xl:h-[150px] 2xl:w-[10.5vw] 2xl:h-[10.5vw] bg-white/15 backdrop-blur-md shadow-2xl"
          style="transform: translateX(-50%);"
        >
          <div class="flex flex-col items-center justify-center text-center gap-2">
            <img :src="helpIncrease" alt="help-increase" class="w-10 h-10 2xl:w-[41px] 2xl:h-[40px]" />
            <span class="font-semibold lg:text-2xl xl:text-3xl 2xl:text-[40px]">51%</span>
            <span class="lg:text-base xl:text-lg 2xl:text-[15px]">Avg. Increase in Profitability</span>
          </div>
        </div>

        <img :src="dashboardImage" alt="eva-platform" class="object-contain w-full place-self-end justify-end" />
      </div>
    </div>
  </div>
</template>
