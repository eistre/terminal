<script setup lang="ts">
const toast = useToast()
const i18n = useI18n()
const emit = defineEmits(['delete'])
const { id } = defineProps<{ id: number }>()

const deleteExercise = async () => {
  const { error } = await useFetch(`/api/exercises/${id}`, {
    method: 'DELETE',
    onResponse: ({ response }) => {
      if (response.status === 204) {
        toast.add({
          id: 'exercise_delete_success',
          icon: 'i-heroicons-check',
          title: i18n.t('exercises.delete_success'),
          timeout: 5000,
          color: 'green'
        })
      }
    }
  })

  if (error.value) {
    toast.add({
      id: 'exercise_delete_failed',
      icon: 'i-heroicons-x-mark',
      title: i18n.t('exercises.delete_error'),
      timeout: 5000,
      color: 'red'
    })
    return
  }

  emit('delete')
}
</script>

<template>
  <UPopover
    :popper="{ arrow: true, placement: 'bottom' }"
  >
    <UTooltip
      :text="$t('exercises.edit.delete')"
      :popper="{ arrow: true, placement: 'bottom' }"
    >
      <UButton
        icon="i-heroicons-trash-solid"
        variant="ghost"
        color="primary"
        size="xl"
      />
    </UTooltip>

    <template #panel="{ close }">
      <UCard
        class="border-[1px] border-primary-600/90 divide-primary-600/90 dark:border-primary-900/90 dark:divide-primary-900/90"
        :ui="{ header: { padding: 'px-4 py-4 sm:px-4' }, body: { padding: 'px-4 py-4 sm:p-4' } }"
      >
        <template #header>
          <span class="flex justify-center text-primary font-semibold">
            {{ $t('exercises.delete_confirm') }}
          </span>
        </template>

        <div class="grid grid-cols-2 gap-4">
          <UButton
            variant="ghost"
            color="primary"
            size="xl"
            @click="close"
          >
            {{ $t('exercises.cancel') }}
          </UButton>
          <UButton
            variant="outline"
            color="red"
            size="xl"
            @click="deleteExercise"
          >
            {{ $t('exercises.confirm') }}
          </UButton>
        </div>
      </UCard>
    </template>
  </UPopover>
</template>
