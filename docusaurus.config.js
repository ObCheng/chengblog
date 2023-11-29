const path = require("path");
const math = require("remark-math");
const katex = require("rehype-katex");

module.exports = {
  title: "认真学习的小诚同学", // 网站标签名称
  // tagline:
  //   "帮助你提升前端开发技能，分享 HTML、CSS、JavaScript、React 和 Vue 等开发实战经验",
  titleDelimiter: "-",
  url: "https://obviouslycheng.vercel.app",
  baseUrl: "/",
  favicon: "https://avatars.githubusercontent.com/u/100484238?v=4", // 网站图标
  organizationName: "ObCheng", // Usually your GitHub org/user name.
  projectName: "obviouslycheng.vercel.app", // Usually your repo name.
  themeConfig: {
    // announcementBar: {
    //   id: "feature_release", // Any value that will identify this message.
    //   content: `更新<a href='/docs/videos/vue/vue-echarts-doughnut-chart'>《Vue 3.0 + ECharts 实现电影票房自定义环形图教程》配套文本</a>；上线小工具栏目，添加<a href='/docs/tools/glassmorphism-generator'>玻璃特效生成器小工具，点击查看</a>`,
    //   backgroundColor: "#fafbfc", // Defaults to `#fff`.
    //   textColor: "#091E42", // Defaults to `#000`.
    // },
    hideableSidebar: true,
    // docs:{
    //   sidebar:{
    //     hideable: true,
    //   }
    // },
    navbar: {
      title: "认真学习的小诚同学",
      logo: {
        alt: "认真学习的小诚同学",
        src: "https://avatars.githubusercontent.com/u/100484238?v=4",
        srcDark: "https://avatars.githubusercontent.com/u/100484238?v=4",
      },
      items: [{
        type: "localeDropdown",
        position: "left",
      },
      // {
      //   to: "/",
      //   label: "首页",
      //   position: "right",
      // },
      {
        to: "docs/all-intro",
        label: "学习笔记",
        position: "right",
        items: [
          {
            label: "Linux驱动入门",
            to: "docs/Linux/embedded-linux-start",
          },
        ]
      },
      {
        to: "docs/all-intro",
        label: "学习路线",
        position: "right",
        items: [
          {
            label: "ARM单片机/RTOS入门",
            to: "https://www.100ask.net/study/singlechip?name=3.%20ARM%E5%8D%95%E7%89%87%E6%9C%BA/RTOS%E5%85%A5%E9%97%A8(%E5%88%9D%E5%AD%A6%E8%80%85)",
          },
          {
            label: "嵌入式Linux快速入门",
            to: "https://www.100ask.net/study/linux?name=3.%E5%B5%8C%E5%85%A5%E5%BC%8FLinux%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8(%E5%88%9D%E5%AD%A6%E8%80%85)",
          },
        ]
      },
      {
        href: "https://obcheng.github.io/photogallery/dist/index.html",
        label: "照片墙",
        position: "right",
      },
      {
        label: "小工具",
        position: "right",
        items: [
          {
            label: "带有GPT-API的WeTab标签页",
            to: "https://www.wetab.link/zh/",
          },
        ],
      },
      {
        href: "https://github.com/JACK-ZHANG-coming/my-now-blog",
        label: "本站来源源码",
        position: "right",
      },
      ],
    },
    algolia: {
      apiKey: "fabfb0e9997e101154ed85d64b7b6a3c",
      indexName: "ZXUQIANCN",
      appId: "LIJMO3C9C4",
      contextualSearch: true,
    },
    footer: {
      style: "dark",
      links: [{
        title: "学习",
        items: [{
          label: "韦东山 百问网课程中心",
          to: "https://www.100ask.net/video",
        },
        {
          label: "正点原子-Bilibili",
          to: "https://space.bilibili.com/394620890",
        },
        {
          label: "立创开源平台",
          to: "https://oshwhub.com/",
        },
        {
          label: "PCB吉迷哥",
          to: "https://space.bilibili.com/430719684",
        },
        {
          label: "动手学深度学习",
          to: "https://zh-v2.d2l.ai/chapter_preface/index.html#id2",
        },
          // {
          //   label: "前端学习路线",
          //   to: "https://objtube.gitee.io/front-end-roadmap/#/",
          // },

        ],
      },
      {
        title: "社交媒体",
        items: [{
          label: "GitHub",
          href: "https://github.com/ObCheng",
        },
        {
          label: "Gitee",
          href: "https://gitee.com/obcheng",
        },
        {
          label: "Bilibili 哔哩哔哩",
          href: "https://space.bilibili.com/305159954",
        },
        ],
      },
      {
        title: "友情链接",
        items: [{
          label: "yuqing521のblog",
          to: "https://yuqing521.github.io/",
        },
        {
          label: "lookroot的个人空间",
          to: "https://www.lookroot.cn/",
        },
        {
          label: "峰华前端工程师",
          to: "https://zxuqian.cn",
        },
        ],
      },
      ],
      copyright: `<p>Copyright © ${new Date().getFullYear()} 111峰华 (张旭乾) Built with Docusaurus.</p>
      <p><a href="http://beian.miit.gov.cn/" style="color: hsl(210deg, 100%, 80%)">冀ICP备14007097号-3</a></p>
      <a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">
      <img alt="Creative Commons License" style="border-width:0" src="/img/creative-commons-license-icon.png" /></a>
      <br />本站所有内容遵循 <a rel="license" href="https://creativecommons.org/licenses/by-nc/4.0/deed.zh-Hans" 
      style="color: hsl(210deg, 100%, 80%)">CC BY-NC 4.0 协议</a>，转载须注明署名和出处，且不可用于商业用途。
      若与其他同步平台协议冲突，以本网站为准。`,
    },
    prism: {
      theme: require("prism-react-renderer/themes/github"),
      darkTheme: require("prism-react-renderer/themes/oceanicNext"),
      defaultLanguage: "javascript",
    },
    // googleAnalytics: {
    //   trackingID: "UA-118572241-1",
    //   anonymizeIP: true, // Should IPs be anonymized?
    // },
    // gtag: {
    //   trackingID: "G-6PSESJX0BM",
    //   // Optional fields.
    //   anonymizeIP: true, // Should IPs be anonymized?
    // },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/JACK-ZHANG-coming/my-now-blog/blob/main",
          remarkPlugins: [math],
          rehypePlugins: [katex],
          showLastUpdateTime: true,
          // sidebar:{
          //   hideeble:{

          //   }
          // }
        },
        blog: {
          path: "./blog",
          routeBasePath: "/",
          blogSidebarTitle: "近期文章",
          remarkPlugins: [math],
          rehypePlugins: [katex],
          feedOptions: {
            type: "all",
            title: "峰华前端工程师1111",
            copyright: `Copyright © ${new Date().getFullYear()} 2222峰华 (张旭乾) Built with Docusaurus.<p><a href="http://beian.miit.gov.cn/">冀ICP备14007097号-3</a></p>`,
          },
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        sitemap: {
          changefreq: "daily",
          priority: 0.5,
        },
      },
    ],
  ],
  // themes: ["@docusaurus/theme-live-codeblock"],
  plugins: [
    path.resolve(__dirname, "./src/plugin/plugin-baidu-analytics"),
    path.resolve(__dirname, "./src/plugin/plugin-baidu-push"),
    // "@docusaurus/plugin-ideal-image",
    path.resolve(__dirname, "./src/plugin/plugin-google-adsense"),
    path.resolve(__dirname, "./src/plugin/plugin-onesignal-push"),
    "docusaurus2-dotenv",
    [
      "@docusaurus/plugin-content-blog",
      {
        id: "lifestyle-blog",
        routeBasePath: "lifestyle",
        path: "./lifestyle",
        feedOptions: {
          type: "all",
          title: "峰华前端工程师2222",
          copyright: `Copyright © ${new Date().getFullYear()} 3333峰华 (张旭乾) Built with Docusaurus.<p><a href="http://beian.miit.gov.cn/">冀ICP备14007097号-3</a></p>`,
        },
      },
    ],
    // [
    //   "@easyops-cn/docusaurus-search-local",
    //   {
    //     hashed: true,
    //     // indexPages: true,
    //     blogRouteBasePath: "/",
    //     language: ["en", "zh"],
    //   },
    // ],
  ],
  stylesheets: [{
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    type: "text/css",
  },
  {
    href: "/katex/katex.min.css",
    type: "text/css",
    integrity: "sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X",
    crossorigin: "anonymous",
  },
  {
    href: "https://fonts.font.im/css?family=Raleway:500,700&display=swap",
    type: "text/css",
    rel: "stylesheet",
  },
    // {
    //   href: "https://fonts.googleapis.com/css2?family=Fira+Code&display=swap",
    //   type: "text/css",
    //   rel: "stylesheet",
    // },
  ],
  i18n: {
    defaultLocale: "zh-CN",
    locales: ["zh-CN"],
    // locales: ["zh-CN", "en"],
    localeConfigs: {
      "zh-CN": {
        label: "中文",
      },
      en: {
        label: "English",
      },
    },
  },
};