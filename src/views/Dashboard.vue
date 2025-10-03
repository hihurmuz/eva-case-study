<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import ChartCard from '../components/ChartCard.vue'

const store = useStore()
const router = useRouter()

const userInfo = computed(() => store.state.userInfo)
const loginEmail = computed(() => store.state.loginEmail)

const handleLogout = () => {
  store.dispatch('logout')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-gray-800">Dashboard</h1>
      <button
        @click="handleLogout"
        class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
      >
        Logout
      </button>
    </header>
    <main class="p-8">
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-md">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">Welcome to Eva Dashboard!</h2>
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-semibold text-gray-700 mb-2">User Information</h3>
            <p class="text-gray-600">Email: {{ loginEmail || userInfo?.user?.email || 'N/A' }}</p>
            <p v-if="userInfo?.user?.name" class="text-gray-600">Name: {{ userInfo.user.name }}</p>
            <p v-if="userInfo?.user?.id" class="text-gray-600">User ID: {{ userInfo.user.id }}</p>
          </div>
        </div>

        <ChartCard />
      </div>
    </main>
  </div>
</template>
