<script setup lang="ts">
import { io } from 'socket.io-client'
import { useResizeObserver } from '@vueuse/core'

type Task = {
  id: number,
  title: string,
  content: string,
  hint: string,
  completed: boolean
}

type Exercise = {
  title: string,
  tasks: Task[]
}

definePageMeta({
  middleware: 'protected'
})

const toast = useToast()
const i18n = useI18n()
const route = useRoute()
const exerciseId = route.params.id
const { data, error } = await useFetch(`/api/exercises/${exerciseId}`, { method: 'GET' })

if (error.value) {
  toast.add({
    id: 'exercise_failed',
    icon: 'i-heroicons-x-mark',
    title: i18n.t('exercises.exercise_error'),
    timeout: 5000,
    color: 'red'
  })

  await navigateTo('/exercises')
}

const exercise = data.value as Exercise
const someCompleted = computed(() => exercise.tasks.some(task => task.completed))

const terminal = ref<HTMLElement | null>(null)
const term = new Terminal({ fontFamily: '"Cascadia Mono", Menlo, monospace' })
const webglAddon = new WebglAddon()
const fitAddon = new FitAddon()
term.loadAddon(webglAddon)
term.loadAddon(fitAddon)
const height = ref(0)
const width = ref(0)

const updated = ref(true)
const connected = ref(false)

const user = useUser()
const isImageReady = useImageReady()
const port = Number(process.env.SOCKET_PORT) || 3001

const socket = io(`${location.hostname}:${port}/terminal`, {
  auth: {
    exerciseId,
    token: user.value?.token
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
  connected.value = true
})

term.onData((data: string) => {
  socket.send({ data })
})

socket.on('message', ({ data }: { data: string }) => {
  term.write(data)
})

socket.on('complete', ({ data }: { data: number[] }) => {
  updated.value = false
  exercise.tasks.forEach((task) => {
    if (data.includes(task.id)) {
      task.completed = true
    }
  })

  // Workaround for closing task if completed
  // as nuxt ui doesn't support programmatic closing
  nextTick(() => {
    updated.value = true
  })
})

useResizeObserver(terminal, (entries) => {
  height.value = entries[0].contentRect.height
  width.value = entries[0].contentRect.width
  fitAddon.fit()
})

term.onResize((event: { cols: number, rows: number }) => {
  const { rows, cols } = event
  socket.emit('resize', {
    rows,
    cols,
    width,
    height
  })
})

onMounted(() => {
  term.open(terminal.value)
  fitAddon.fit()
})

onUnmounted(() => {
  socket.disconnect()
})

function resetExercise () {
  socket.emit('reset_exercise')

  updated.value = false
  exercise.tasks.forEach((task) => {
    task.completed = false
  })
  nextTick(() => {
    updated.value = true
  })

  socket.once('reset_exercise', ({ status }) => {
    if (status) {
      toast.add({
        id: 'reset_success',
        icon: 'i-heroicons-check',
        title: i18n.t('exercises.exercise_reset_success'),
        timeout: 5000,
        color: 'green'
      })
    } else {
      toast.add({
        id: 'reset_failed',
        icon: 'i-heroicons-x-mark',
        title: i18n.t('exercises.exercise_reset_error'),
        timeout: 5000,
        color: 'red'
      })
    }
  })
}

function resetPod () {
  if (connected.value) {
    connected.value = false

    socket.emit('reset_pod')
    term.write('\n\r\n*** Resetting pod ***\r\n')

    socket.disconnect().connect()
  }
}
</script>

<template>
  <UContainer>
    <UCard :ui="{ ring: '', shadow: '' }">
      <template #header>
        <div class="flex justify-between text-3xl font-semibold">
          <span>{{ exercise.title }}</span>
          <div class="flex gap-4">
            <UButton
              :label="$t('exercises.exercise_reset')"
              variant="outline"
              :disabled="!someCompleted"
              @click="resetExercise"
            />
            <UButton
              :label="$t('exercises.pod_reset')"
              variant="outline"
              :disabled="!connected"
              @click="resetPod"
            />
          </div>
        </div>
      </template>

      <div class="flex gap-4">
        <div class="w-1/3">
          <ExerciseTasks
            :tasks="exercise.tasks"
            :updated="updated"
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

<style>
@import "xterm/css/xterm.css";

.xterm-viewport {
  overflow: hidden !important;
}
</style>
