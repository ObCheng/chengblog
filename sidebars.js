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
    type: 'doc',
    id: 'Learning_route', // 文档 ID
    label: '嵌入式学习路线', // 侧边栏标签
  },
  {
    type: 'category',
    label: 'Linux驱动入门',
    items: [
      'Linux-drive/embedded-linux-start',
      'Linux-drive/01开发环境搭建',
      {
        type: 'category',
        label: '驱动模板1_通用驱动框架',
        items: [
          'Linux-drive/模板1_通用框架/00intro',
          'Linux-drive/模板1_通用框架/01hello驱动程序',
          'Linux-drive/模板1_通用框架/02改进Hello驱动程序',
          'Linux-drive/模板1_通用框架/03模板1-最简单的通用框架模板',
        ],
      },
      {
        type: 'category',
        label: '驱动模板1_操作硬件',
        items: [
          'Linux-drive/模板1_操作硬件/00intro',
          'Linux-drive/模板1_操作硬件/01LED',
          'Linux-drive/模板1_操作硬件/02人体红外传感器SR501',
          'Linux-drive/模板1_操作硬件/03超声波测距模块',
        ],
      },
      {
        type: 'category',
        label: '驱动模板2_平台设备驱动模型与设备树',
        items: [
          'Linux-drive/模板2/00intro',
          'Linux-drive/模板2/01平台总线驱动与设备树',
          'Linux-drive/模板2/02平台设备驱动模板',
          'Linux-drive/模板2/03使用模板2修改motor驱动',
        ],
      },
      {
        type: 'category',
        label: '驱动模板3_i2c驱动程序',
        items: [
          'Linux-drive/模板3_I2C/00intro',
          'Linux-drive/模板3_I2C/01_I2C基础知识',
          'Linux-drive/模板3_I2C/02_I2C驱动程序模板',
        ],
      },
      {
        type: 'category',
        label: '驱动模板4_spi驱动程序',
        items: [
          'Linux-drive/模板4_SPI/00intro',
          'Linux-drive/模板4_SPI/01SPI基础知识',
          'Linux-drive/模板4_SPI/02SPI设备驱动模板',
        ],
      },
    ],
  },

  {
    type: 'category',
    label: 'Linux项目实战',
    items: [
      'Linux-project-practice/embedded-linux-projectpractice-start',
      {
        type: 'category',
        label: '01电子产品量产工具',
        items: [
          'Linux-project-practice/电子产品量产工具/00intro_test',
          'Linux-project-practice/电子产品量产工具/01程序框架',
        ],
      },
    ]
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