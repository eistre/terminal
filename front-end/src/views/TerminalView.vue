<template>
  <div class="terminal">
    <div
      style="
        display: flex;
        justify-content: center;
        margin-bottom: 6vh;
        margin-top: 2vh;
      "
    >
      <div style="position: relative">
        <img
          style="position: absolute; left: 1%; z-index: 1"
          src="https://comserv.cs.ut.ee/img/TY_est.gif"
        />
        <img
          style="position: relative"
          src="https://comserv.cs.ut.ee/img/ty_head_1100.png"
        />
      </div>
    </div>
    <h2 style="margin: 3vh auto; text-align: center">
      Harjutused ja Ubuntu terminal
    </h2>
    <div style="display: flex; justify-content: center" id="content">
      <div
        id="tasks-container"
        style="
          flex: 1 1 0%;
          margin-right: 20px;
          padding-top: 2em;
          position: relative;
          max-width: 33%;
        "
      >
        <div id="header" style="display: flex; position: absolute; top: 0">
          <div style="display: flex">
            <p id="name" style="display: flex">
              Nimi:
              <strong style="margin: 0 10px 0 6px">{{this.$route.query.name}}</strong>
            </p>
            <p v-if="this.$route.query.name!='külaline'" id="matriculation" style="display: flex">
              Matrikkel:
              <strong style="margin-left: 6px">{{this.$route.query.mat}}</strong>
            </p>
          </div>
        </div>
        <button class="collapsible">Ülesanne 1</button>
        <div class="content">
          <p id="task1">
            a)Liigu kausta <code>/etc</code> ning kuva <code>hosts</code> faili
            sisu terminali.
            <span class="tooltip"
              >(Vihje)
              <span class="tooltiptext">kasuta käsku <code>cat</code> </span>
            </span>
          </p>
        </div>
        <button class="collapsible">Ülesanne 2</button>
        <div class="content">
          <p id="task2">
            Loo <code>test</code> kasutaja kodukausta alamkaust mille nimes
            esineb vähemalt üks inglise tähestiku väiketäht, number, tühik,
            võrdlusmärk ja lauselõpumärk.
          </p>
        </div>
        <button class="collapsible">Ülesanne 3</button>
        <div class="content">
          <p id="task3">
            Leia kõik failid koos suhtelise või absoluutse failiteega, mis
            asuvad <code>/home</code> kaustas või selle alamkaustades ja
            lõppevad sõnega "peidetud" (jutumärkideta).
            <span class="tooltip"
              >(Vihje)
              <span class="tooltiptext">Kasuta käsku <code>find</code></span>
            </span>
          </p>
        </div>
        <button class="collapsible">Ülesanne 4</button>
        <div class="content">
          <p id="task4">
            Leia fail <code>/home</code> kaustast või alamkaustast mis sisaldab
            teksti <code>parool</code> (Jäta parool meelde, sul läheb seda
            hiljem vaja!).
          </p>
        </div>
        <button class="collapsible">Ülesanne 5</button>
        <div class="content">
          <p id="task5">
            Paigaldage tarkvara nimega <code>nano</code>. Leidke, kus asuvad
            rakenduse <code>nano</code>
            binaarid.
            <span class="tooltip"
              >(Vihje)
              <span class="tooltiptext"
                ><code>sudo apt ...</code>, <code>whereis</code>, sudo parooli
                leidsite eelmises punktis
              </span>
            </span>
          </p>
        </div>
        <button class="collapsible">Ülesanne 6</button>
        <div class="content">
          <p id="task6">
            Loo kasutaja <code>test</code> kodukausta fail nimega andmeturve ja
            faili sisuks pane oma nimi (täpitähtede asemel kasuta näiteks
            numbreid või teisi tähti). Muuda faili õigusi nii, et faili omanik
            (<code>test</code>) ja faili grupp (<code>root</code>) saaks faili
            kirjutada ja lugeda aga mitte käivitada ja teistele kasutajatele
            oleks keelatud failile ligipääs. Enesekontrolliks ja
            automaatkontrolli käivitamiseks käivitage käsk
            <code>ls -la /home/test/andmeturve</code>
          </p>
        </div>
        <button class="collapsible">Ülesanne 7</button>
        <div class="content" style="z-index: 3">
          <p id="task7">
            Laadige alla lehekülg
            <code>
              https://courses.cs.ut.ee/MTAT.TK.012/2015_fall/uploads/Main/anton_hansen_tammsaare_tode_ja_oigus_i.txt </code
            >. Leidke <strong>ainult</strong> allatõmmatud failis esinevate
            <strong>sõnade</strong> arv.
            <span class="tooltip"
              >(Vihje)
              <span class="tooltiptext">
                vaja läheb käske <code>wget</code> ja <code>wc</code> . Uurige
                <code>wc</code> lisaparameetreid.</span
              >
            </span>
          </p>
        </div>
        <button class="collapsible">Ülesanne 8</button>
        <div class="content">
          <p id="task8">
            Loo oma eesnimega kasutaja kelle kodukaustaks on
            <code>/home/[eesnimi]</code>.
          </p>
        </div>
        <button class="collapsible">Ülesanne 9</button>
        <div class="content">
          <p id="task9">
            Kustutage kaust <code>/home/test/.ajutine</code> ja selle sisu.
          </p>
        </div>
        <button class="collapsible">Ülesanne 10</button>
        <div class="content">
          <p id="task10">
            Kuvage kõik käimasolevad protsessid.
            <span class="tooltip"
              >(Vihje)
              <span class="tooltiptext"> uurige käsku <code>ps</code> </span>
            </span>
          </p>
        </div>
        <span style="margin: 2vh 0 0 1vw">
          <h3>
            Korduma kippuvad vead: kui terminali aken läheb "lolliks" käivita
            käsk <code>clear</code> või uuenda akent (<code>F5</code>). Kui
            terminaliaknas lõppeb ühendus enneaegselt või ei looda ühendust
            üldse, uuenda akent (<code>Ctr + R</code> või <code>F5</code>)
          </h3>
          <p style="margin: 2vh 0 0 0">
            Vigadest teatamiseks ning tagasiside andmiseks palun täitke
            <a href="https://forms.gle/sxXF8phFJHQcdExv7"
              >tagasiside küsitlus</a
            >
            (kulub alla 3 minuti)
          </p>
        </span>
      </div>
      <Terminal></Terminal>
    </div>
  </div>
</template>

<style>
</style>

<script>
import Terminal from "@/components/Terminal.vue";
export default {
  components: {
    Terminal,
  },
};
</script>