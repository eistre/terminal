<template>
  <div class="terminal">
    <Banner />
    <h2>
      Harjutused ja Ubuntu terminal
    </h2>
    <div id="content">
      <div id="tasks-container">
        <UserCredentials />
        <Task v-for="(item, index) in items" :nr="index + 1" :desc="item.desc" :hint="item.hint" />
      </div>
      <Terminal></Terminal>
    </div>
  </div>
</template>

<style>
h2 {
  margin: 3vh auto;
  text-align: center
}

#content {
  display: flex;
  justify-content: center
}

#tasks-container {
  flex: 1 1 0%;
  margin-right: 20px;
  padding-top: 2em;
  position: relative;
  max-width: 33%;
}
</style>

<script>
import Terminal from "@/components/Terminal.vue";
import Task from "../components/Task.vue";
import Banner from "../components/Banner.vue";
import UserCredentials from "../components/UserCredentials.vue";

export default {
  components: {
    Terminal,
    Task,
    Banner,
    UserCredentials
  },
  data() {
    return {
      items: [{
        desc: 'a)Liigu kausta <code>/etc</code> ning kuva <code>hosts</code> faili sisu terminali.',
        hint: "kasuta käsku <code>cat</code>"
      },
      {
        desc: `Loo <code>test</code> kasutaja kodukausta alamkaust mille nimes 
        esineb vähemalt üks inglise tähestiku väiketäht, number, tühik, võrdlusmärk
         ja lauselõpumärk.`
      },
      {
        desc: `Leia kõik failid koos suhtelise või absoluutse failiteega, mis
            asuvad <code>/home</code> kaustas või selle alamkaustades ja
            lõppevad sõnega "peidetud" (jutumärkideta).`,
        hint: "Kasuta käsku <code>find</code>"
      },
      {
        desc: `Leia fail <code>/home</code> kaustast või alamkaustast mis sisaldab
            teksti <code>parool</code> (Jäta parool meelde, sul läheb seda
            hiljem vaja!).`
      },
      {
        desc: `Paigaldage tarkvara nimega <code>nano</code>. Leidke, kus asuvad
            rakenduse <code>nano</code>
            binaarid.`,
        hint: `<code>sudo apt ...</code>, <code>whereis</code>, sudo parooli
                leidsite eelmises punktis`
      },
      {
        desc: `Loo kasutaja <code>test</code> kodukausta fail nimega andmeturve ja
          faili sisuks pane oma nimi (täpitähtede asemel kasuta näiteks
          numbreid või teisi tähti). Muuda faili õigusi nii, et faili omanik
          (<code>test</code>) ja faili grupp (<code>root</code>) saaks faili
          kirjutada ja lugeda aga mitte käivitada ja teistele kasutajatele
          oleks keelatud failile ligipääs. Enesekontrolliks ja
          automaatkontrolli käivitamiseks käivitage käsk
          <code>ls -la /home/test/andmeturve</code>`,
      },
      {
        desc: `Laadige alla lehekülg
          <code>
              https://courses.cs.ut.ee/MTAT.TK.012/2015_fall/uploads/Main/anton_hansen_tammsaare_tode_ja_oigus_i.txt </code>.
          Leidke <strong>ainult</strong> allatõmmatud failis esinevate
          <strong>sõnade</strong> arv.`,
        hint: `vaja läheb käske <code>wget</code> ja <code>wc</code> . Uurige
              <code>wc</code> lisaparameetreid.`
      },
      {
        desc: `Loo oma eesnimega kasutaja kelle kodukaustaks on
          <code>/home/[eesnimi]</code>.`
      },
      {
        desc: `Kustutage kaust <code>/home/test/.ajutine</code> ja selle sisu.`,
      },
      {
        desc: `Kuvage kõik käimasolevad protsessid.`,
        hint: `uurige käsku <code>ps</code>`
      }
      ]
    }
  }
};
</script>