/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  mySidebar: [{
    type: 'doc',
    id: 'all-intro', // 文档 ID
    label: '开始', // 侧边栏标签
  },
  {
    type: 'category',
    label: 'html(0)',
    items: [
      // "html/01第一个html",
      // "html/02LocalStorage与SessionStorage",
      // "html/03HTML DOM节点操作",

    ]
  },
  {
    type: 'category',
    label: 'Linux驱动入门(5)',
    items: [
      'Linux/embedded-linux-start',
      'Linux/01开发环境搭建',
      {
        type: 'category',
        label: '通用驱动框架',
        items: [
          'Linux/通用框架/00intro',
          'Linux/通用框架/01hello驱动程序',
        ],
      },

      {
        type: 'category',
        label: '驱动模板1最简单的通用框架模板',
        items: [
          'Linux/模板1/00intro',

        ],
      },

      {
        type: 'category',
        label: '驱动模板2平台设备驱动模型与设备树',
        items: [
          'Linux/模板2/00intro',
          'Linux/模板2/01平台总线驱动与设备树',
        ],
      },

    ],
  },
  {
    type: 'category',
    label: 'javascript(0)',
    items: []
  },
  {
    type: 'category',
    label: '微信小程序(0)',
    items: []
  },
  {
    type: 'category',
    label: 'HTTP(0)',
    items: []
  },
  {
    type: 'category',
    label: 'Browser(0)',
    items: []
  },
  {
    type: 'category',
    label: 'Webpack(0)',
    items: []
  },
  {
    type: 'category',
    label: 'git代码托管(0)',
    items: []
  },
  {
    type: 'category',
    label: '数据结构与算法(0)',
    items: []
  },
  {
    type: 'category',
    label: '设计模式(0)',
    items: []
  },
  {
    type: 'category',
    label: '编码规范(0)',
    items: []
  },
  {
    type: 'category',
    label: '杂谈(0)',
    items: []
  },
  ],
};