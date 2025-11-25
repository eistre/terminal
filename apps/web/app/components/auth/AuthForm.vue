<script setup lang="ts">
const { t } = useI18n();

const items = computed(() => [{
  slot: 'login',
  label: t('auth.login'),
}, {
  slot: 'signup',
  label: t('auth.signup'),
}]);
</script>

<template>
  <UTabs :items="items" :ui="{ root: 'min-h-[320px]' }">
    <template #login>
      <AuthLogin class="mt-2" />
    </template>

    <template #signup>
      <AuthSignUp class="mt-2" />
    </template>
  </UTabs>
</template>
