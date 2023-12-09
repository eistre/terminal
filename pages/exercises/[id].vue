<script setup lang="ts">
import { io } from 'socket.io-client'

definePageMeta({
  middleware: 'protected'
})

// Work around to build fail when importing css
useHead({
  link: [{ rel: 'stylesheet', type: 'text/css', href: 'css/xterm.css' }]
})

const route = useRoute()
const { data: exercise } = await useFetch(`/api/exercises/${route.params.id}`, { method: 'GET' })

const terminal = ref<HTMLElement | null>(null)
const term = new Terminal({ fontFamily: '"Cascadia Mono", Menlo, monospace' })
const webglAddon = new WebglAddon()
const fitAddon = new FitAddon()

const user = useAuthenticatedUser()
const isImageReady = useImageReady()
const port = Number(process.env.SOCKET_PORT) || 3001

const socket = io(`localhost:${port}/terminal`, {
  auth: {
    token: user.value.token
  }
})

socket.on('connect', () => {
  term.write('\r\n*** Connected to backend ***\r\n')

  if (!isImageReady.value) {
    term.write('\r\n*** Waiting on docker image build ***\r\n')
  }
})

socket.on('disconnect', () => {
  term.write('\r\n*** Disconnected from backend ***\r\n')
})

socket.on('ready', () => {
  term.onData((data: string) => {
    socket.send(data)
  })

  socket.on('message', (data: string) => {
    term.write(data)
  })
})

onMounted(() => {
  term.open(terminal.value)
  term.loadAddon(webglAddon)
  term.loadAddon(fitAddon)

  fitAddon.fit()
})

onUnmounted(() => {
  socket.disconnect()
})
</script>

<template>
  <UContainer>
    <UCard :ui="{ ring: '', shadow: '' }">
      <template #header>
        <div class="flex justify-center text-3xl font-semibold">
          <span>{{ exercise.title }}</span>
        </div>
      </template>

      <div class="flex gap-4">
        <div class="w-1/3">
          <ExerciseTasks
            :tasks="exercise.tasks"
          />
        </div>

        <div class="w-2/3 h-[32rem] p-4 bg-black rounded-xl">
          <div
            ref="terminal"
            class="w-full h-full"
          />
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
