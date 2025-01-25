<script setup lang="ts">
const user = useUser()
const socket = useStatusSocket()
const config = useRuntimeConfig()
const cluster = useCluster()
const i18n = useI18n()
const isCloud = config.public.runtime === 'CLOUD'

if (isCloud && user.value && !socket.value) {
  createSocket()
}

const text = computed(() => {
  switch (cluster.value) {
    case 'Running':
      return undefined
    case 'Starting':
      return i18n.t('bar.cluster_starting')
    case 'Stopping':
      return i18n.t('bar.cluster_stopping')
    case 'Stopped':
      return i18n.t('bar.cluster_stopped')
  }
})
</script>

<template>
  <ClientOnly>
    <UTooltip
      :text="text"
      :popper="{ arrow: true, placement: 'bottom' }"
    >
      <UButton
        :loading="cluster !== 'Running'"
        variant="ghost"
        color="gray"
        class="text-white cursor-default disabled:cursor-default"
        size="xl"
      />
    </UTooltip>
  </ClientOnly>
</template>
