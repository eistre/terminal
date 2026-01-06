<script setup lang="ts">
import type { UpsertEmailDomainPayload } from '#shared/email-domains-validation';
import type { TableColumn } from '#ui/types';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { EmailDomain as DbEmailDomain } from '@terminal/database';
import { upsertEmailDomainPayloadSchema } from '#shared/email-domains-validation';

definePageMeta({ middleware: ['require-admin'] });

type EmailDomain = Pick<DbEmailDomain, 'id' | 'domain' | 'skipVerification'>;

const { t } = useI18n();
const toast = useToast();

const draft = reactive<UpsertEmailDomainPayload>({
  domain: '',
  skipVerification: false,
});

const submitting = ref(false);
const canSubmit = computed(() => !submitting.value && upsertEmailDomainPayloadSchema.safeParse(draft).success);
const modifyingId = ref<number>(-1);

const { data, refresh, pending } = await useFetch('/api/admin/email-domains', { method: 'GET' });

const tableColumns: TableColumn<EmailDomain>[] = [
  { accessorKey: 'domain', header: t('emailDomains.tableDomain') },
  { accessorKey: 'skipVerification', header: t('emailDomains.tableSkipVerification') },
  { id: 'actions', header: '' },
];

async function createDomain(event: FormSubmitEvent<UpsertEmailDomainPayload>) {
  if (submitting.value) {
    return;
  }

  try {
    submitting.value = true;

    await $fetch('/api/admin/email-domains', {
      method: 'POST',
      body: event.data,
    });

    draft.domain = '';
    draft.skipVerification = false;

    await refresh();
    toast.add({
      color: 'success',
      icon: 'i-lucide-check-circle',
      title: t('emailDomains.toastAdded'),
    });
  }
  catch {
    toast.add({
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('emailDomains.toastAddFailed'),
    });
  }
  finally {
    submitting.value = false;
  }
}

async function toggleSkipVerification(domain: EmailDomain) {
  if (modifyingId.value !== -1) {
    return;
  }

  try {
    modifyingId.value = domain.id;

    await $fetch(`/api/admin/email-domains/${domain.id}`, {
      method: 'PUT',
      body: {
        id: domain.id,
        domain: domain.domain,
        skipVerification: !domain.skipVerification,
      },
    });

    await refresh();
    toast.add({
      color: 'success',
      icon: 'i-lucide-check-circle',
      title: domain.skipVerification
        ? t('emailDomains.toastSkipDisabled')
        : t('emailDomains.toastSkipEnabled'),
    });
  }
  catch {
    toast.add({
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('emailDomains.toastUpdateFailed'),
    });
  }
  finally {
    modifyingId.value = -1;
  }
}

async function deleteDomain(domain: EmailDomain) {
  if (modifyingId.value !== -1) {
    return;
  }

  try {
    modifyingId.value = domain.id;

    await $fetch(`/api/admin/email-domains/${domain.id}`, { method: 'DELETE' });

    await refresh();
    toast.add({
      color: 'success',
      icon: 'i-lucide-check-circle',
      title: t('emailDomains.toastDeleted'),
    });
  }
  catch {
    toast.add({
      color: 'error',
      icon: 'i-lucide-alert-circle',
      title: t('emailDomains.toastDeleteFailed'),
    });
  }
  finally {
    modifyingId.value = -1;
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('emailDomains.title')"
        :description="t('emailDomains.description')"
      />

      <UPageBody>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <UPageCard>
              <template #title>
                <div class="font-semibold">
                  {{ t('emailDomains.addDomain') }}
                </div>
              </template>

              <USeparator />

              <UForm
                class="flex flex-col gap-4"
                :schema="upsertEmailDomainPayloadSchema"
                :state="draft"
                @submit="createDomain"
              >
                <UFormField
                  :label="t('emailDomains.fieldDomain')"
                  name="domain"
                >
                  <UInput
                    v-model="draft.domain"
                    :placeholder="t('emailDomains.placeholderDomain')"
                  />
                </UFormField>

                <UFormField name="skipVerification">
                  <UCheckbox v-model="draft.skipVerification" :description="t('emailDomains.fieldSkipVerification')" />
                </UFormField>

                <UButton
                  type="submit"
                  :loading="submitting"
                  :disabled="!canSubmit"
                  icon="i-lucide-plus"
                  :ui="{ base: 'w-fit' }"
                >
                  {{ t('emailDomains.add') }}
                </UButton>
              </UForm>
            </UPageCard>
          </div>

          <div class="lg:col-span-2">
            <UPageCard>
              <UTable
                :data="data?.domains ?? []"
                :columns="tableColumns"
                :loading="pending"
                :empty="t('emailDomains.empty')"
                :ui="{ th: 'text-md p-0 pb-4', td: 'px-0' }"
              >
                <template #skipVerification-cell="{ row }">
                  <UBadge
                    variant="subtle"
                    :class="modifyingId === -1 ? 'hover:cursor-pointer' : ''"
                    :color="row.original.skipVerification ? 'success' : 'neutral'"
                    @click="toggleSkipVerification(row.original)"
                  >
                    {{ row.original.skipVerification ? t('emailDomains.yes') : t('emailDomains.no') }}
                  </UBadge>
                </template>

                <template #actions-cell="{ row }">
                  <div class="flex justify-end">
                    <UPopover arrow>
                      <UButton
                        size="sm"
                        color="error"
                        variant="ghost"
                        icon="i-lucide-trash"
                        :loading="modifyingId === row.original.id"
                        :disabled="modifyingId !== -1"
                      >
                        {{ t('emailDomains.delete') }}
                      </UButton>

                      <template #content="{ close }">
                        <UCard :ui="{ body: 'flex flex-col gap-4' }">
                          <div class="font-semibold">
                            {{ t('emailDomains.deleteConfirmTitle', { domain: row.original.domain }) }}
                          </div>

                          <div class="flex justify-end gap-2">
                            <UButton
                              variant="ghost"
                              color="neutral"
                              @click="close"
                            >
                              {{ t('emailDomains.cancel') }}
                            </UButton>
                            <UButton
                              variant="solid"
                              color="error"
                              @click="() => { close(); deleteDomain(row.original); }"
                            >
                              {{ t('emailDomains.confirm') }}
                            </UButton>
                          </div>
                        </UCard>
                      </template>
                    </UPopover>
                  </div>
                </template>
              </UTable>
            </UPageCard>
          </div>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
