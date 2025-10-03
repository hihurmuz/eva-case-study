<script setup lang="ts">
import { onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

onMounted(async () => {
  if (store.getters.isAuthenticated) {
    try {
      await store.dispatch('fetchUserInformation')
      if (router.currentRoute.value.path === '/login') {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Failed to fetch user information:', err)
      store.dispatch('logout')
      router.push('/login')
    }
  }
})
</script>

<template>
  <router-view />
</template>

