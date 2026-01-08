export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'gray',
    },
    pageHeader: {
      slots: {
        root: 'py-4',
        wrapper: 'gap-1.5',
        title: 'text-xl sm:text-2xl',
        description: 'text-md',
      },
    },
    pageBody: {
      base: 'mt-4 pb-12',
    },
  },
});
