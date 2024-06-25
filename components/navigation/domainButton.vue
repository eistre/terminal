// template from https://ui.nuxt.com/getting-started/examples
<script setup lang="ts">
const openModal = ref(false)
</script>

<template>
  <ClientOnly>
    <UTooltip
      :text="$t('bar.domain')"
      :popper="{ arrow: true, placement: 'bottom' }"
    >
      <UButton
        icon="i-heroicons-inbox-solid"
        variant="ghost"
        color="gray"
        class="text-white"
        size="xl"
        @click="openModal = true"
      />

      <UModal v-model="openModal" :ui="{ width: 'w-full sm:max-w-[640px]'}">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold">
                {{ $t('bar.domain') }}
              </h2>
              <UButton
                icon="i-heroicons-x-mark-solid"
                color="gray"
                variant="ghost"
                size="xl"
                @click="openModal = false"
              />
            </div>
          </template>

          <Domains />
        </UCard>
      </UModal>
    </UTooltip>
  </ClientOnly>
</template>
