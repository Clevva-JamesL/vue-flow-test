<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

async function onSubmit() {
  isSubmitting.value = true

  try {
    await auth.login({
      email: email.value,
      password: password.value,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch {
    // error surfaced via auth.error
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
    <Card class="w-full">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access your literary timelines.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="email">Email</label>
            <Input id="email" v-model="email" type="email" autocomplete="email" required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium" for="password">Password</label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <p v-if="auth.error" class="text-sm text-destructive">{{ auth.error }}</p>
          <Button class="w-full" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
          </Button>
        </form>
        <p class="mt-4 text-center text-sm text-muted-foreground">
          No account?
          <RouterLink class="text-foreground underline-offset-4 hover:underline" to="/register">
            Create one
          </RouterLink>
        </p>
      </CardContent>
    </Card>
  </main>
</template>
