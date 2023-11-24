<script setup lang="ts">
import type { Task } from '~/utils/task'

const { tasks } = defineProps<{ tasks: Task[] }>()
</script>

<template>
  <UAccordion :items="tasks">
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
</template>
