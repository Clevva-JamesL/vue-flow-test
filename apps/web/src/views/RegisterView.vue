<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

async function onSubmit() {
  isSubmitting.value = true

  try {
    await auth.register({
      email: email.value,
      password: password.value,
    })
    await router.replace('/')
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
        <CardTitle>Create account</CardTitle>
        <CardDescription>Start building and publishing literary timelines.</CardDescription>
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
              autocomplete="new-password"
              minlength="8"
              required
            />
            <p class="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <p v-if="auth.error" class="text-sm text-destructive">{{ auth.error }}</p>
          <Button class="w-full" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creating account…' : 'Create account' }}
          </Button>
        </form>
        <p class="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?
          <RouterLink class="text-foreground underline-offset-4 hover:underline" to="/login">
            Sign in
          </RouterLink>
        </p>
      </CardContent>
    </Card>
  </main>
</template>
