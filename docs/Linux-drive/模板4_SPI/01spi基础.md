---
id: 01SPI基础知识
title: SPI基础
sidebar_label: SPI基础
---

## SPI基础知识

硬件连接：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/SPI%E7%A1%AC%E4%BB%B6%E8%BF%9E%E6%8E%A5.png)

SCK：时钟线

DO(MOSI)：数据输出

DI(MISO)：数据输入

CSx：片选信号

示例如下：在每一个时钟周期传输数据

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/SPI%E4%BC%A0%E8%BE%93%E7%A4%BA%E4%BE%8B.png)

问题：

SCK的初始电平？	CPOL	极性

SCK的第1 or 2个边沿传输数据？	CPHA	相位

| CPOL | CPHA | 模式 | 含义                                            |
| ---- | ---- | ---- | ----------------------------------------------- |
| 0    | 0    | 0    | SPI CLK初始电平为低电平，在第一个时钟沿采样数据 |
| 0    | 1    | 1    | SPI CLK初始电平为低电平，在第二个时钟沿采样数据 |
| 1    | 0    | 2    | SPI CLK初始电平为高电平，在第一个时钟沿采样数据 |
| 1    | 1    | 3    | SPI CLK初始电平为高电平，在第二个时钟沿采样数据 |

我们常用的是**模式0和模式3**，因为它们都是在上升沿采样数据，不用去在乎时钟的初始电平是什么，只要在上升沿采集数据就行。

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/SPI%E4%BC%A0%E8%BE%93%E6%97%B6%E5%BA%8F.png)

SPI控制器内部框图：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/SPI%E5%86%85%E9%83%A8%E6%A1%86%E5%9B%BE.png)

在控制寄存器里可以设置极性和相位；状态寄存器可以分辨数据是否发送完成，或使能中断等等

波特率寄存器，设置时钟频率；数据寄存器，把要发送的数据写入数据寄存器即可



SPI控制器有驱动程序，提供SPI的传输能力。

SPI设备也有自己的驱动程序，提供SPI设备的访问能力：

* 它知道怎么访问这个设备，它知道这个设备的数据含义是什么
* 它会调用SPI控制器的函数来收发数据。

内核SPI设备驱动：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/SPI%E6%80%BB%E7%BA%BF%E8%AE%BE%E5%A4%87%E9%A9%B1%E5%8A%A8%E6%A8%A1%E5%9E%8B%E7%BB%93%E6%9E%84.png)

## SPI数据结构

### SPI控制器

Linux中使用spi_master结构体描述SPI控制器，里面最重要的成员就是`transfer`函数指针：

```c
struct spi_master {
	struct device	dev;

	struct list_head list;

	s16			bus_num;

	......
        
	int			(*transfer)(struct spi_device *spi,
						struct spi_message *mesg);

	/* called on release() to free memory provided by spi_master */
	void			(*cleanup)(struct spi_device *spi);
```



### SPI设备

Linux中使用spi_device结构体描述SPI设备，里面记录有设备的片选引脚、频率、挂在哪个SPI控制器下面：

```c
struct spi_device {
        struct device		dev;
        struct spi_master	*master;
        u32			max_speed_hz;
        u8			chip_select;
        u8			bits_per_word;
        u16			mode;
    #define	SPI_CPHA	0x01			/* clock phase */
    #define	SPI_CPOL	0x02			/* clock polarity */
    #define	SPI_MODE_0	(0|0)			/* (original MicroWire) */
    #define	SPI_MODE_1	(0|SPI_CPHA)
    #define	SPI_MODE_2	(SPI_CPOL|0)
    #define	SPI_MODE_3	(SPI_CPOL|SPI_CPHA)
    #define	SPI_CS_HIGH	0x04			/* chipselect active high? */
    #define	SPI_LSB_FIRST	0x08			/* per-word bits-on-wire */
    #define	SPI_3WIRE	0x10			/* SI/SO signals shared */
    #define	SPI_LOOP	0x20			/* loopback mode */
    #define	SPI_NO_CS	0x40			/* 1 dev/bus, no chipselect */
    #define	SPI_READY	0x80			/* slave pulls low to pause */
    #define	SPI_TX_DUAL	0x100			/* transmit with 2 wires */
    #define	SPI_TX_QUAD	0x200			/* transmit with 4 wires */
    #define	SPI_RX_DUAL	0x400			/* receive with 2 wires */
    #define	SPI_RX_QUAD	0x800			/* receive with 4 wires */
        int			irq;
        void			*controller_state;
        void			*controller_data;
        char			modalias[SPI_NAME_SIZE];
        int			cs_gpio;	/* chip select gpio */

        /* the statistics */
        struct spi_statistics	statistics;

        /*
         * likely need more hooks for more protocol options affecting how
         * the controller talks to each chip, like:
         *  - memory packing (12 bit samples into low bits, others zeroed)
         *  - priority
         *  - drop chipselect after each word
         *  - chipselect delays
         *  - ...
         */
};
```

### SPI设备驱动

Linux中使用spi_driver结构体描述SPI设备驱动：

```c
struct spi_driver {
	const struct spi_device_id *id_table;
	int			(*probe)(struct spi_device *spi);
	int			(*remove)(struct spi_device *spi);
	void			(*shutdown)(struct spi_device *spi);
	struct device_driver	driver;
};
```



## SPI驱动框架

![09_spi_drv_frame](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/09_spi_drv_frame.png)

SPI控制器的驱动程序基于"平台总线设备驱动"模型来实现：

* 在设备树里描述SPI控制器的硬件信息，在设备树子节点里描述挂在下面的SPI设备的信息
* 在platform_driver中提供一个probe函数
  * 它会注册一个spi_master
  * 还会解析设备树子节点，创建spi_device结构体

跟"平台总线设备驱动模型"类似，Linux中也有一个"SPI总线设备驱动模型"：

* 左边是spi_driver，使用C文件实现，里面有id_table表示能支持哪些SPI设备，有probe函数
* 右边是spi_device，用来描述SPI设备，比如它的片选引脚、频率
  * 可以来自设备树：比如由SPI控制器驱动程序解析设备树后创建、注册spi_device
  * 可以来自C文件：比如使用`spi_register_board_info`创建、注册spi_device



> 在I2C设备模型中，我们直接使用了I2C总线设备模型，为什么？
>
> ```c
> static const struct of_device_id myi2c_dt_match[] = {
> 	{ .compatible = "100ask,i2cdev" },
> 	{},
> };
> 
> static const struct i2c_device_id i2c_drv_id[] = {
> 	{"xxxyyy", 0},
> 	{},
> };
> 
> static struct i2c_driver my_i2c_driver = {
> 	.driver = {
> 		   .name = "100ask_i2c_drv",
> 		   .owner = THIS_MODULE,
> 		   .of_match_table = myi2c_dt_match,
> 	},
> 	.probe = i2c_drv_probe,
> 	.remove = i2c_drv_remove,
> 	.id_table = i2c_drv_id,
> };
> ```
>
> ```shell
> &i2c1 {
>     clock-frequency = <100000>;
>     pinctrl-names = "default";
>     pinctrl-0 = <&pinctrl_i2c1>;
>     status = "okay";
>     at24c02{
>         compatible = "100ask,i2cdev";
>         reg = <0x50>;
>     };
> };
> ```
>
> 



## SPI设备树的处理过程

设备树示例：

```shell
	spi@f00 {
		#address-cells = <1>;
		#size-cells = <0>;
		compatible = "fsl,mpc5200b-spi","fsl,mpc5200-spi";
		reg = <0xf00 0x20>;
		interrupts = <2 13 0 2 14 0>;
		interrupt-parent = <&mpc5200_pic>;
	
		cs-gpios = <&gpio1 0 0>, <&gpio1 1 0>, <&gpio1 2 0>;
		
		ethernet-switch@0 {
			compatible = "micrel,ks8995m";
			spi-max-frequency = <1000000>;
			reg = <0>;
		};

		codec@1 {
			compatible = "ti,tlv320aic26";
			spi-max-frequency = <100000>;
			reg = <1>;
		};
	};
```

`spi@f00`表示一个spi_master

#address-cells 表示描述地址的cells数量；#size-cells 表示地址长度

`compatible = "fsl,mpc5200b-spi","fsl,mpc5200-spi";`对应一个spi_master driver驱动程序

`cs-gpios = <&gpio1 0 0>, <&gpio1 1 0>, <&gpio1 2 0>;`表示片选引脚，一一对应

`ethernet-switch@0`和`codec@1`是两个spi子节点，分别对应一个SPI设备，这个SPI设备连接在该SPI Master下面



子节点的属性：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E8%AE%BE%E5%A4%87%E6%A0%91SPI%E5%AD%90%E8%8A%82%E7%82%B9%E5%B1%9E%E6%80%A7.png)

前三个属性是必须的，其余属性是可选的`空属性`，需要时直接写上即可，不写默认为0，写了为1，如`spi-cpol;`



1.上述的SPI节点会在platform_driver中，即spi_master驱动

- 构造成一个spi_master

- 解析子节点，构造spi_device



spi_device结构体：

```c
struct spi_device {
	struct device		dev;
	struct spi_master	*master;
	u32			max_speed_hz;
	u8			chip_select;
	u8			bits_per_word;
	u16			mode;
#define	SPI_CPHA	0x01			/* clock phase */
#define	SPI_CPOL	0x02			/* clock polarity */
#define	SPI_MODE_0	(0|0)			/* (original MicroWire) */
#define	SPI_MODE_1	(0|SPI_CPHA)
#define	SPI_MODE_2	(SPI_CPOL|0)
#define	SPI_MODE_3	(SPI_CPOL|SPI_CPHA)
#define	SPI_CS_HIGH	0x04			/* chipselect active high? */
#define	SPI_LSB_FIRST	0x08			/* per-word bits-on-wire */
#define	SPI_3WIRE	0x10			/* SI/SO signals shared */
#define	SPI_LOOP	0x20			/* loopback mode */
#define	SPI_NO_CS	0x40			/* 1 dev/bus, no chipselect */
#define	SPI_READY	0x80			/* slave pulls low to pause */
#define	SPI_TX_DUAL	0x100			/* transmit with 2 wires */
#define	SPI_TX_QUAD	0x200			/* transmit with 4 wires */
#define	SPI_RX_DUAL	0x400			/* receive with 2 wires */
#define	SPI_RX_QUAD	0x800			/* receive with 4 wires */
	int			irq;
	void			*controller_state;
	void			*controller_data;
	char			modalias[SPI_NAME_SIZE];
	int			cs_gpio;	/* chip select gpio */

	/* the statistics */
	struct spi_statistics	statistics;

	/*
	 * likely need more hooks for more protocol options affecting how
	 * the controller talks to each chip, like:
	 *  - memory packing (12 bit samples into low bits, others zeroed)
	 *  - priority
	 *  - drop chipselect after each word
	 *  - chipselect delays
	 *  - ...
	 */
};
```

各个成员含义如下：

* `max_speed_hz`：该设备能支持的SPI时钟最大值
* `chip_select`：是这个spi_master下的第几个设备
  * 在spi_master中有一个cs_gpios数组，里面存放有下面各个spi设备的片选引脚
  * spi_device的片选引脚就是：`cs_gpios[spi_device.chip_select]`
* `cs_gpio`：这是可选项，也可以把spi_device的片选引脚记录在这里
* `bits_per_word`：每个基本的SPI传输涉及多少位（**不是来自于设备树，来自应用程序，传输的时候可以设置它**）
  * word：我们使用SPI控制器时，一般是往某个寄存器里写入数据，SPI控制器就会把这些数据一位一位地发送出去
  * 一个寄存器是32位的，被称为一个word(有时候也称为double word)
  * 这个寄存器里多少位会被发送出去？使用bits_per_word来表示
  * 扩展：bits_per_word是可以大于32的，也就是每次SPI传输可能会发送多于32位的数据，这适用于DMA突发传输
* `mode`：含义广泛，看看结构体里那些宏
  * SPI_CPHA：在第1个周期采样，在第2个周期采样？
  * SPI_CPOL：平时时钟极性
    * SPI_CPHA和SPI_CPOL组合起来就可以得到4种模式
    * SPI_MODE_0：平时SCK为低(SPI_CPOL为0)，在第1个周期采样(SPI_CPHA为0)
    * SPI_MODE_1：平时SCK为低(SPI_CPOL为0)，在第2个周期采样(SPI_CPHA为1)
    * SPI_MODE_2：平时SCK为高(SPI_CPOL为1)，在第1个周期采样(SPI_CPHA为0)
    * SPI_MODE_3：平时SCK为高(SPI_CPOL为1)，在第2个周期采样(SPI_CPHA为1)
  * SPI_CS_HIGH：一般来说片选引脚时低电平有效，SPI_CS_HIGH表示高电平有效
  * SPI_LSB_FIRST：
    * 一般来说先传输MSB(最高位)，SPI_LSB_FIRST表示先传LSB(最低位)；
    * 很多SPI控制器并不支持SPI_LSB_FIRST
  * SPI_3WIRE：SO、SI共用一条线
  * SPI_LOOP：回环模式，就是SO、SI连接在一起
  * SPI_NO_CS：只有一个SPI设备，没有片选信号，也不需要片选信号
  * SPI_READY：SPI从设备可以拉低信号，表示暂停、表示未就绪
  * SPI_TX_DUAL：发送数据时有2条信号线
  * SPI_TX_QUAD：发送数据时有4条信号线
  * SPI_RX_DUAL：接收数据时有2条信号线
  * SPI_RX_QUAD：接收数据时有4条信号线



处理过程：

Linux内核`drivers\spi\spi.c`的

![22_porcess_spi_devicetree](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/22_porcess_spi_devicetree.png)



---

请点击**左侧菜单**（移动端为**右下角**）选择要查看的所有笔记吧。