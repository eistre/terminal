<template>
  <UContainer>
    <UCard :ui="{ ring: '', shadow: '' }">
      <template #header>
        <div class="flex flex-col items-center gap-2 text-3xl font-semibold">
          <span>Linuxi Käsurea harjutuskeskkond</span>
          <span>Ubuntu terminal veebibrauseris</span>
        </div>
      </template>

      <div class="flex flex-col items-center gap-5">
        <span class="flex justify-center text-2xl font-semibold">Tuleviku info</span>
        <span>Info konteineri kohta</span>
        <span>Info konteineri kohta</span>
        <span>Info konteineri kohta</span>
      </div>

      <template #footer>
        <div class="flex justify-center">
          <AuthLogin />
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
