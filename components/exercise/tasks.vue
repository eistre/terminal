<script setup lang="ts">
type Task = {
  id: number,
  title: string,
  content: string,
  hint: string,
  completed: boolean
}

const colorMode = useColorMode()
const { tasks } = defineProps<{ tasks: Task[] }>()

const firstIncomplete = computed(() => tasks.find(task => !task.completed)?.id)
const variant = computed(() => colorMode.preference === 'dark' ? 'outline' : 'solid')
const items = computed(() => {
  return tasks.map((task) => {
    return {
      ...task,
      label: task.title,
      color: task.completed ? 'green' : 'primary',
      defaultOpen: task.id === firstIncomplete.value,
      variant: variant.value
    }
  })
})
</script>

<template>
  <ClientOnly>
    <UAccordion :items="items">
      <template #item="{ item }">
        <div class="px-4">
          <span style="overflow-wrap: break-word">{{ item.content }}</span>

          <UPopover
            v-if="item.hint"
            mode="hover"
            class="w-20"
          >
            <span>(Vihje)</span>

            <template #panel>
              <div class="p-2 w-fit">
                {{ item.hint }}
              </div>
            </template>
          </UPopover>
        </div>
      </template>
    </UAccordion>
  </ClientOnly>
</template>
