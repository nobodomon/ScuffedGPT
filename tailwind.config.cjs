const config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {}
  },
  // daisyui:{
  //   themes: [
  //     {
  //         // 'dark':{
  //         //     'primary': '#800080',
  //         //     'secondary': '#DDA0DD',
  //         //     'accent': '#E6E6FA',
  //         //     'neutral': '#D8BFD8',
  //         //     'base': '#FFFFFF',
  //         //     'info': '#EE82EE',
  //         //     'success': '#B4EEB4',
  //         //     'warning': '#FFA07A',
  //         //     'error': '#8B0000',
  //         // }
  //     }
  //   ]
  // },
  plugins: [require("daisyui")]
};

module.exports = config;