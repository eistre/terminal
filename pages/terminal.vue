<script setup lang="ts">
import { io } from 'socket.io-client'
import type { Task } from '~/utils/task'

definePageMeta({
  middleware: 'protected'
})

// Work around to build fail when importing css
useHead({
  link: [{ rel: 'stylesheet', type: 'text/css', href: 'css/xterm.css' }]
})

const colorMode = useColorMode()
const variant = computed(() => colorMode.preference === 'dark' ? 'outline' : 'solid')

const tasks = computed<Task[]>(() => [
  {
    label: 'Ülesanne 1',
    defaultOpen: true,
    variant: variant.value,
    content: 'Liigu kausta `/etc` ning kuva `hosts` faili sisu terminali.',
    hint: 'Kasuta käsku `cat`'
  },
  {
    label: 'Ülesanne 2',
    variant: variant.value,
    content: 'Loo `test` kasutaja kodukausta alamkaust mille nimes esineb vähemalt üks inglise tähestiku väiketäht, number, tühik, võrdlusmärk ja lauselõpumärk.'
  },
  {
    label: 'Ülesanne 3',
    variant: variant.value,
    content: 'Leia kõik failid koos suhtelise või absoluutse failiteega, mis asuvad `/home` kaustas või selle alamkaustades ja lõppevad sõnega "peidetud" (jutumärkideta).',
    hint: 'Kasuta käsku `find`'
  },
  {
    label: 'Ülesanne 4',
    variant: variant.value,
    content: 'Leia fail `/home` kaustast või alamkaustast, mis sisaldab teksti `parool` (Jäta parool meelde, sul läheb seda hiljem vaja!).'
  },
  {
    label: 'Ülesanne 5',
    variant: variant.value,
    content: 'Paigaldage tarkvara nimega `nano`. Leidke, kus asuvad rakenduse `nano` binaarid.',
    hint: '`sudo apt ...`, `whereis`, sudo parooli leidsite eelmises punktis'
  },
  {
    label: 'Ülesanne 6',
    variant: variant.value,
    content: 'Loo kasutaja `test` kodukausta fail nimega andmeturve ja faili sisuks pane oma nimi (täpitähtede asemel kasuta näiteks numbreid või teisi tähti). Muuda faili õigusi nii, et faili omanik (`test`) ja faili grupp (`root`) saaks faili kirjutada ja lugeda aga mitte käivitada ja teistele kasutajatele oleks keelatud failile ligipääs. Enesekontrolliks ja automaatkontrolli käivitamiseks käivitage käsk `ls -la /home/test/andmeturve`'
  },
  {
    label: 'Ülesanne 7',
    variant: variant.value,
    content: 'Laadige alla lehekülg `https://courses.cs.ut.ee/MTAT.TK.012/2015_fall/uploads/Main/anton_hansen_tammsaare_tode_ja_oigus_i.txt`. Leidke ainult allatõmmatud failis esinevate sõnade arv.',
    hint: 'Vaja läheb käske `wget` ja `wc`. Uurige `wc` lisaparameetreid.'
  },
  {
    label: 'Ülesanne 8',
    variant: variant.value,
    content: 'Loo oma eesnimega kasutaja kelle kodukaustaks on `/home/[eesnimi]`.'
  },
  {
    label: 'Ülesanne 9',
    variant: variant.value,
    content: 'Kustutage kaust `/home/test/.ajutine` ja selle sisu.'
  },
  {
    label: 'Ülesanne 10',
    variant: variant.value,
    content: 'Kuvage kõik käimasolevad protsessid.',
    hint: 'Uurige käsku `ps`'
  }
])

const terminal = new Terminal({ fontFamily: '"Cascadia Mono", Menlo, monospace' })
const webglAddon = new WebglAddon()
const fitAddon = new FitAddon()
const term = ref<HTMLElement | null>(null)

const user = useAuthenticatedUser()
const port = parseInt(process.env.SOCKET_PORT ?? '3001')

onMounted(() => {
  terminal.open(term.value)
  terminal.loadAddon(webglAddon)
  terminal.loadAddon(fitAddon)

  fitAddon.fit()

  const socket = io(`localhost:${port}`, {
    auth: {
      token: user.value.token
    }
  })

  // TODO make component
  socket.on('connect', () => {
    terminal.write('\r\n*** Connected to backend ***\r\n')
  })

  terminal.onData((data: string) => {
    socket.send(data)
  })

  socket.on('message', (data: string) => {
    terminal.write(data)
  })

  socket.on('disconnect', () => {
    terminal.write('\r\n*** Disconnected from backend ***\r\n')
  })
})
</script>

<template>
  <UContainer>
    <UCard :ui="{ ring: '', shadow: '' }">
      <template #header>
        <div class="flex justify-center text-3xl font-semibold">
          <span>Harjutused ja Ubuntu terminal</span>
        </div>
      </template>

      <div class="flex gap-4">
        <TerminalTasks
          class="w-1/3"
          :tasks="tasks"
        />

        <div class="w-2/3 h-auto p-4 bg-black rounded-xl">
          <div
            ref="term"
            class="w-full h-auto"
          />
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
