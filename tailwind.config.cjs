const config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {}
  },
  // daisyui:{
  //   themes: [
  //     {
  //         'dark':{
  //             ...require("daisyui/src/colors/themes")["[data-theme=dark]"],
  //             'primary': '#3300cc',
  //         },
  //         'light':{
  //           ...require("daisyui/src/colors/themes")["[data-theme=light]"],
  //         }
  //     }
  //   ]
  // },
  plugins: [require("daisyui")]
};

module.exports = config;