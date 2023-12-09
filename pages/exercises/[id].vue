<script setup lang="ts">
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

onMounted(() => {
  term.open(terminal.value)
  term.loadAddon(webglAddon)
  term.loadAddon(fitAddon)

  fitAddon.fit()
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
