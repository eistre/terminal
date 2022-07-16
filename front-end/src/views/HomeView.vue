<script>
import Banner from '@/components/Banner.vue'
import LoginButtons from '../components/LoginButtons.vue';

export default {
  components: { Banner, LoginButtons }
};
</script>

<template>
  <div class="body">
    <div>
      <Banner />
      <h2>
        Linuxi käsurea harjutuskeskkond - Ubuntu terminal veebibrauseris
      </h2>
    </div>
    <div class="main">
      <div>
        <p>
          Veebisait on koostatud bakalaureusetöö osana. Lehe eesmärgiks on
          meelde tuletada põhilisemad Linuxi käsurea käsud ning nende
          kasutusjuhud. Lisaks ülesannetele on olemas ka automaatkontroll mis
          värvib ülesande roheliseks kui see on edukalt sooritatud.
        </p>
        <p>
          Pärast ülesannete läbi tegemist palun täitke ka
          <a href="https://forms.gle/sxXF8phFJHQcdExv7"> tagasiside küsitlus</a>.
        </p>
      </div>
      <h3>Registreerimisinfo</h3>
      <p>
        Matrikkel peab koosnema ainult tähtedest ja numbritest. Tühikuid ei tohi
        lõpus olla. Registreerimiseks sisestage oma täispikk nimi ja matrikkel.
        Pärast esimest korda nime ja matrikli sisestamist ning nupu "Logi sisse"
        vajutamist ei saa oma nime ümber muuta sest see jääb seotuks matrikliga.
        Muutes matriklit luuakse uus ühendus uude arvutisse. 24h pärast viimast
        sisselogimist kustutatakse masin koos failidega.
      </p>
      <LoginButtons></LoginButtons>
    </div>
  </div>
</template>
<style>
h2 {
  width: 50%;
  margin: 4vh auto;
  text-align: center
}

.body {
  padding: 2vh 2vw
}

h3 {
  text-align: center
}
</style>