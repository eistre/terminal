export default defineI18nConfig(() => ({
  legacy: false,
  locale: useCookie('lang').value || 'ee',
  messages: {
    ee: {
      bar: {
        university: 'Tartu Ülikool arvutiteaduse instituut',
        img: '/arvutiteaduse_instituut_est_white_2021.svg',
        light: 'Lülitu heledale režiimile',
        dark: 'Lülitu tumedale režiimile'
      },
      main: {
        title1: 'Linuxi käsurea harjutuskeskkond',
        title2: 'Ubuntu terminal veebibrauseris',
        info1: 'Info',
        info2: 'TODO'
      },
      auth: {
        name: 'Nimi',
        enter_name: 'Sisestage oma nimi',
        enter_password: 'Sisestage parool',
        password_error: 'Parool peab olema vähemalt 8 sümbolit pikk',
        password: 'Parool',
        delete_user: 'Kustuta kasutaja',
        delete_success: 'Kasutaja edukalt kustutatud',
        delete_error: 'Viga kasutaja kustutamisel',
        john: 'Juhan',
        begin: 'Alusta',
        auth_error: 'Sisselogimine ebaõnnestus',
        logout: 'Logi välja',
        logout_failed: 'Välja logimine ebaõnnestus'
      },
      docker: {
        image_ready: 'Kettapilt valmis',
        image_building: 'Kettapilt ehitamisel'
      },
      exercises: {
        exercise_reset_error: 'Tulemuste lähtestamine ebaõnnestus',
        exercise_reset_success: 'Tulemused lähtestatud edukalt',
        exercise_reset: 'Lähtesta tulemused',
        pod_reset: 'Lähtesta kapsel',
        exercise_error: 'Harjutust ei leitud',
        exercises_error: 'Harjutuste päring ebaõnnestus',
        exercises: 'Harjutused',
        create_new: 'Loo uus',
        delete_success: 'Harjutus edukalt kustutatud',
        delete_error: 'Harjutust ei saadud kustutada',
        delete_confirm: 'Kinnitage kustutamine',
        confirm: 'Kinnita',
        cancel: 'Tühista',
        edit_text: 'Muuda',
        edit: {
          success: 'Harjutus loodud edukalt',
          new: 'Uus harjutus',
          exercise: 'Harjutus',
          add_task: 'Lisa ülesanne',
          task: 'Ülesanne',
          save: 'Salvesta',
          save_error1: 'Kõik vajalikud väljad peavad olema täidetud',
          save_error2: 'Harjutus peab sisaldama vähemalt ühte ülesannet',
          title: 'Pealkiri',
          title_error: 'Sisestage harjutuse pealkiri',
          description: 'Lühikirjeldus',
          description_error: 'Sisestage harjutuse lühikirjeldus',
          description_placeholder: 'Linuxi käsurea ülesanded',
          task_name: 'Nimi',
          task_name_error: 'Sisestage ülesande nimi',
          task_regex_description: 'Automaatkontrolliks vajalik regex väärtus',
          task_regex_error: 'Sisestage ülesannet tuvastav regex',
          task_hint: 'Vihje',
          task_hint_description: 'Valikuline vihje, mida saab kasutada ülesande lahendamiseks',
          task_content: 'Kirjeldus',
          task_content_error: 'Sisestage ülesande kirjeldus',
          task_content_placeholder: 'Kuva kausta sisu',
          delete: 'Kustuta',
          update_success: 'Harjutus muudetud edukalt',
          create_fail: 'Harjutuse loomine ebaõnnestus',
          update_fail: 'Harjutuse muutmine ebaõnnestus'
        }
      }
    },
    en: {
      bar: {
        university: 'University of Tartu Institute of Computer Science',
        img: '/arvutiteaduse_instituut_eng_white_2021.svg',
        light: 'Switch to light theme',
        dark: 'Switch to dark theme'
      },
      main: {
        title1: 'Linux command line practice environment',
        title2: 'Ubuntu terminal in the web browser',
        info1: 'Info',
        info2: 'TODO'
      },
      auth: {
        name: 'Name',
        enter_name: 'Enter your name',
        enter_password: 'Enter your password',
        password_error: 'Password must be at least 8 characters long',
        password: 'Password',
        delete_user: 'Delete account',
        delete_success: 'Account deleted successfully',
        delete_error: 'Account deletion unsuccessful',
        john: 'John',
        begin: 'Begin',
        auth_error: 'Logging in failed',
        logout: 'Log out',
        logout_failed: 'Logging out failed'
      },
      docker: {
        image_ready: 'Image ready',
        image_building: 'Image building'
      },
      exercises: {
        exercise_reset_error: 'Resetting results failed',
        exercise_reset_success: 'Results reset successfully',
        exercise_reset: 'Reset results',
        pod_reset: 'Reset pod',
        exercise_error: 'Exercise not found',
        exercises_error: 'Fetching exercises failed',
        exercises: 'Exercises',
        create_new: 'Create new',
        delete_success: 'Exercise deleted successfully',
        delete_error: 'Exercise deletion failed',
        delete_confirm: 'Confirm deletion',
        confirm: 'Confirm',
        cancel: 'Cancel',
        edit_text: 'Edit',
        edit: {
          success: 'Exercise created successfully',
          new: 'New exercise',
          exercise: 'Exercise',
          add_task: 'Add task',
          task: 'Task',
          save: 'Save',
          save_error1: 'All required fields must be filled',
          save_error2: 'An exercises must contain at least one task',
          title: 'Title',
          title_error: 'Enter the title of the exercise',
          description: 'Short description',
          description_error: 'Enter the short description of the exercise',
          description_placeholder: 'Linux command line tasks',
          task_name: 'Name',
          task_name_error: 'Enter the task name',
          task_regex_description: 'Enter the regex value for automated checking',
          task_regex_error: 'Enter the regex value',
          task_hint: 'Hint',
          task_hint_description: 'Enter an optional hint which can be used to solve a task',
          task_content: 'Description',
          task_content_error: 'Enter the description of the task',
          task_content_placeholder: 'Show the content of the directory',
          delete: 'Delete',
          update_success: 'Exercise updated successfully',
          create_fail: 'Exercise creation failed',
          update_fail: 'Exercise update failed'
        }
      }
    }
  }
}))
