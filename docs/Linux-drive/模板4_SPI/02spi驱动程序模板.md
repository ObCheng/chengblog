---
id: 02SPI设备驱动模板
title: SPI设备驱动模板
sidebar_label: SPI设备驱动模板
---

## SPI设备驱动模板

### 要做什么

设备树：

```shell
&ecspi1 {
    pinctrl-names = "default";
    pinctrl-0 = <&pinctrl_ecspi1>;

    fsl,spi-num-chipselects = <2>;
    cs-gpios = <&gpio4 26 GPIO_ACTIVE_LOW>, <&gpio4 24 GPIO_ACTIVE_LOW>;
    status = "okay";
   # 子节点
    spidev0: spi@0 {
        compatible = "rohm,dh2228fv";
        reg = <0>;
        spi-max-frequency = <5000000>;
    };
    
    spidev1: spi@1 {
        compatible = "rohm,dh2228fv";
        reg = <1>;
        spi-max-frequency = <5000000>;
    };

};
```

可以找到spi读函数：构造一个spi_transfer结构体，调用spi_sync_transfer函数

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/spi_read.png)

1.设备树 -> spi_driver

2.注册：spi_driver.of_match_table（匹配函数）

​				 .probe（进行register_chrdev）然后调用file_operations结构体的.read .write

### 接口函数

接口函数都在这个内核文件里：`include\linux\spi\spi.h`

* 简易函数

  ```c
  /**
   * SPI同步写
   * @spi: 写哪个设备
   * @buf: 数据buffer
   * @len: 长度
   * 这个函数可以休眠
   *
   * 返回值: 0-成功, 负数-失败码
   */
  static inline int
  spi_write(struct spi_device *spi, const void *buf, size_t len);
  
  /**
   * SPI同步读
   * @spi: 读哪个设备
   * @buf: 数据buffer
   * @len: 长度
   * 这个函数可以休眠
   *
   * 返回值: 0-成功, 负数-失败码
   */
  static inline int
  spi_read(struct spi_device *spi, void *buf, size_t len);
  
  
  /**
   * spi_write_then_read : 先写再读, 这是一个同步函数
   * @spi: 读写哪个设备
   * @txbuf: 发送buffer
   * @n_tx: 发送多少字节
   * @rxbuf: 接收buffer
   * @n_rx: 接收多少字节
   * 这个函数可以休眠
   * 
   * 这个函数执行的是半双工的操作: 先发送txbuf中的数据，在读数据，读到的数据存入rxbuf
   *
   * 这个函数用来传输少量数据(建议不要操作32字节), 它的效率不高
   * 如果想进行高效的SPI传输，请使用spi_{async,sync}(这些函数使用DMA buffer)
   *
   * 返回值: 0-成功, 负数-失败码
   */
  extern int spi_write_then_read(struct spi_device *spi,
  		const void *txbuf, unsigned n_tx,
  		void *rxbuf, unsigned n_rx);
  
  /**
   * spi_w8r8 - 同步函数，先写8位数据，再读8位数据
   * @spi: 读写哪个设备
   * @cmd: 要写的数据
   * 这个函数可以休眠
   *
   *
   * 返回值: 成功的话返回一个8位数据(unsigned), 负数表示失败码
   */
  static inline ssize_t spi_w8r8(struct spi_device *spi, u8 cmd);
  
  /**
   * spi_w8r16 - 同步函数，先写8位数据，再读16位数据
   * @spi: 读写哪个设备
   * @cmd: 要写的数据
   * 这个函数可以休眠
   *
   * 读到的16位数据: 
   *     低地址对应读到的第1个字节(MSB)，高地址对应读到的第2个字节(LSB)
   *     这是一个big-endian的数据
   *
   * 返回值: 成功的话返回一个16位数据(unsigned), 负数表示失败码
   */
  static inline ssize_t spi_w8r16(struct spi_device *spi, u8 cmd);
  
  /**
   * spi_w8r16be - 同步函数，先写8位数据，再读16位数据，
   *               读到的16位数据被当做big-endian，然后转换为CPU使用的字节序
   * @spi: 读写哪个设备
   * @cmd: 要写的数据
   * 这个函数可以休眠
   *
   * 这个函数跟spi_w8r16类似，差别在于它读到16位数据后，会把它转换为"native endianness"
   *
   * 返回值: 成功的话返回一个16位数据(unsigned, 被转换为本地字节序), 负数表示失败码
   */
  static inline ssize_t spi_w8r16be(struct spi_device *spi, u8 cmd);
  ```

* 复杂的函数

  ```c
  /**
   * spi_async - 异步SPI传输函数，简单地说就是这个函数即刻返回，它返回后SPI传输不一定已经完成
   * @spi: 读写哪个设备
   * @message: 用来描述数据传输，里面含有完成时的回调函数(completion callback)
   * 上下文: 任意上下文都可以使用，中断中也可以使用
   *
   * 这个函数不会休眠，它可以在中断上下文使用(无法休眠的上下文)，也可以在任务上下文使用(可以休眠的上下文) 
   *
   * 完成SPI传输后，回调函数被调用，它是在"无法休眠的上下文"中被调用的，所以回调函数里不能有休眠操作。
   * 在回调函数被调用前message->statuss是未定义的值，没有意义。
   * 当回调函数被调用时，就可以根据message->status判断结果: 0-成功,负数表示失败码
   * 当回调函数执行完后，驱动程序要认为message等结构体已经被释放，不能再使用它们。
   *
   * 在传输过程中一旦发生错误，整个message传输都会中止，对spi设备的片选被取消。
   *
   * 返回值: 0-成功(只是表示启动的异步传输，并不表示已经传输成功), 负数-失败码
   */
  extern int spi_async(struct spi_device *spi, struct spi_message *message);
  
  /**
   * spi_sync - 同步的、阻塞的SPI传输函数，简单地说就是这个函数返回时，SPI传输要么成功要么失败
   * @spi: 读写哪个设备
   * @message: 用来描述数据传输，里面含有完成时的回调函数(completion callback)
   * 上下文: 能休眠的上下文才可以使用这个函数
   *
   * 这个函数的message参数中，使用的buffer是DMA buffer
   *
   * 返回值: 0-成功, 负数-失败码
   */
  extern int spi_sync(struct spi_device *spi, struct spi_message *message);
  
  
  /**
   * spi_sync_transfer - 同步的SPI传输函数
   * @spi: 读写哪个设备
   * @xfers: spi_transfers数组，用来描述传输
   * @num_xfers: 数组项个数
   * 上下文: 能休眠的上下文才可以使用这个函数
   *
   * 返回值: 0-成功, 负数-失败码
   */
  static inline int
  spi_sync_transfer(struct spi_device *spi, struct spi_transfer *xfers,
  	unsigned int num_xfers);
  ```

  

### 函数解析

在SPI子系统中，用spi_transfer结构体描述一个传输，用spi_message管理过个传输。

SPI传输时，发出N个字节，就可以同时得到N个字节。

* 即使只想读N个字节，也必须发出N个字节：可以发出0xff
* 即使只想发出N个字节，也会读到N个字节：可以忽略读到的数据。



spi_transfer结构体如下图所示：

* tx_buf：不是NULL的话，要发送的数据保存在里面
* rx_buf：不是NULL的话，表示读到的数据不要丢弃，保存进rx_buf里

![image-20220330162208146](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/70_spi_transfer.png)



可以构造多个spi_transfer结构体，把它们放入一个spi_message里面。

spi_message结构体如下图所示：

![image-20220330162650541](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/71_spi_message.png)



SPI传输示例：

![image-20220330163124260](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/72_spidev_sync_write.png)



### 编写

驱动程序先看入口和出口函数：注册和注销spi驱动

```c
/* 在入口函数 */
static int __init spi_drv_init(void)
{
    /* 注册spi_driver */
	return spi_register_driver(&my_spi_driver);
}

/* 有入口函数就应该有出口函数：卸载驱动程序时，就会去调用这个出口函数
 */
static void __exit spi_drv_exit(void)
{
	/* 注销spi_driver */
	spi_unregister_driver(&my_spi_driver);
}
```

spi_driver的定义如下：

```c
static const struct of_device_id myspi_dt_match[] = {
	{ .compatible = "100ask,spidev" },
	{},
};

static struct spi_driver my_spi_driver = {
	.driver = {
		   .name = "100ask_spi_drv",
		   .owner = THIS_MODULE,
		   .of_match_table = myspi_dt_match,
	},
	.probe = spi_drv_probe,
	.remove = spi_drv_remove,
};
```

主要是of_match_table、probe、remove。

在myspi_dt_match中定义，compatible属性与设备树节点的compatible一致。

在probe函数：记录spi设备`g_spi_device = spi;`,注册字符设备等

```c
static int spi_drv_probe(struct spi_device *spi)
{
	// struct spi_adapter *adapter = client->adapter;	//获取I2C总线
	// struct device_node *np = client->dev.of_node;	//获取设备树节点
	/* 记录spi_device */
	g_spi_device = spi;

	/* 注册字符设备 */
	major = register_chrdev(0, "100ask_spi", &spi_drv_fops);  /* /dev/gpio_desc */

	my_spi_class = class_create(THIS_MODULE, "100ask_spi_class");
	if (IS_ERR(my_spi_class)) {
		printk("%s %s line %d\n", __FILE__, __FUNCTION__, __LINE__);
		unregister_chrdev(major, "100ask_spi");
		return PTR_ERR(my_spi_class);
	}

	device_create(my_spi_class, NULL, MKDEV(major, 0), NULL, "myspi"); /* /dev/myspi */
	return 0;
}

static int spi_drv_remove(struct spi_device *spi)
{
	/* 注销字符设备 */
	device_destroy(my_spi_class, MKDEV(major, 0));
	class_destroy(my_spi_class);
	unregister_chrdev(major, "100ask_spi");

	return 0;
}
```

然后，就说fops结构体

```c
/* 定义自己的file_operations结构体                                              */
static struct file_operations spi_drv_fops = {
	.owner	 = THIS_MODULE,
	.read    = spi_drv_read,
	.write   = spi_drv_write,
	.poll	 = spi_drv_poll,
	.fasync  = spi_drv_fasync,
};
```

```c
/* 实现对应的open/read/write等函数，填入file_operations结构体                   */
static ssize_t spi_drv_read (struct file *file, char __user *buf, size_t size, loff_t *offset)
{
	// int err;
	// struct spi_transfer msgs[2];
	/* 1. 初始化spi_transfer */

	/* 2. 发起传输 */
	// int spi_sync_transfer(struct spi_device *spi, struct spi_transfer *xfers, unsigned int num_xfers);

	/* 3. copy_to_user */

	return 0;
}

static ssize_t spi_drv_write(struct file *file, const char __user *buf, size_t size, loff_t *offset)
{
	// int err;
	// struct spi_transfer msgs[2];
	/* 1. copy_from_user */

	/* 2. 初始化spi_transfer */
	
	/* 3. 发起传输 */
	// int spi_sync_transfer(struct spi_device *spi, struct spi_transfer *xfers, unsigned int num_xfers);

	return 0;
	
}
```

SPI读写基本流程一致，使用的是构造`spi_transfer`数组和`spi_sync_transfer`同步发送函数，还有别的函数见[接口函数](###接口函数)



## DAC示例

1.设备树

- 放在哪个SPI控制器下面
- DAC模块的片选引脚
- SPI频率
- compatible属性：用来寻址驱动程序

修改设备树：`arch/arm/boot/dts/100ask_imx6ull-14x14.dts`

6ull的DAC片选引脚是gpio4_26，频率设置为1Mhz，compatible需要匹配驱动程序

```shell
&ecspi1 {
    pinctrl-names = "default";
    pinctrl-0 = <&pinctrl_ecspi1>;

    fsl,spi-num-chipselects = <2>;
    cs-gpios = <&gpio4 26 GPIO_ACTIVE_LOW>, <&gpio4 24 GPIO_ACTIVE_LOW>;
    status = "okay";


    dac: dac {
        compatible = "100ask,spidev";
        reg = <0>;
        spi-max-frequency = <1000000>;
    };
```

修改设备树后：

```shell
make dtbs
cp arch/arm/boot/dts/100ask_imx6ull-14x14.dtb ~/nfs_rootfs/
```

在开发板上

```shell
cp /mnt/100ask_imx6ull-14x14.dtb /boot
reboot
```

然后在开发板上可以查看设备树，找到dac模板

```shell
[root@imx6ull:~] cd /sys/firmware/devicetree/base/
[root@imx6ull:/sys/firmware/devicetree/base] find -name dac
./soc/aips-bus@02000000/spba-bus@02000000/ecspi@02008000/dac

cd ./soc/aips-bus@02000000/spba-bus@02000000/ecspi@02008000/dac
[root@imx6ull:/sys/firmware/devicetree/base/soc/aips-bus@02000000/spba-bus@02000000/ecspi@02008000/dac] ls
compatible         name               reg                spi-max-frequency
[root@imx6ull:/sys/firmware/devicetree/base/soc/aips-bus@02000000/spba-bus@02000000/ecspi@02008000/dac] cat compatible 
100ask,spidev

[root@imx6ull:/sys/firmware/devicetree/base/soc/aips-bus@02000000/spba-bus@02000000/ecspi@02008000/dac] hexdump reg
0000000 0000 0000                              
0000004
```

也可以在spi总线下面看到：spi0.0 表示spi0下面的0号设备，注意—在硬件上是从spi1开始的，内核里面是spi0开始

```shell
cd /sys/bus/spi/devices/
[root@imx6ull:/sys/bus/spi/devices] ls
spi0.0      spi2.0      spi32766.0

cd spi0.0
ls
modalias    of_node     power       statistics  subsystem   uevent
```

装载驱动程序后,spi0.0下面多出了driver：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E8%A3%85%E8%BD%BD%E9%A9%B1%E5%8A%A8%E7%A8%8B%E5%BA%8F%E5%90%8E%E6%80%BB%E7%BA%BF%E7%9A%84SPI%E8%AE%BE%E5%A4%87.png)

2.编写驱动

DAC模块数据格式：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/DAC%E6%A8%A1%E5%9D%97spi%E9%80%9A%E8%AE%AF%E6%A0%BC%E5%BC%8F.png)

我使用的优信电子购买的`TLC5615`模块：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/dac%E6%A8%A1%E5%9D%97%E6%8E%A5%E7%BA%BF.png)

仅需要编写write函数即可，其他与模板一样

- 先定义内核数组kern_buf，用来存放16位数据；spi_transfer t传输结构体，初始化为0
- 从用户空间copy 2字节的数据放在short变量val中，左移两位保证低两位为0，再清除高4位
- 然后把val的高八位放在kern_buf[0]中，低八位放在kern_buf[1]中，因为SPI默认传输格式是MSB（高位优先）
- 最后构造spi_transfer结构体，发起传输

```c
static ssize_t spi_drv_write(struct file *file, const char __user *buf, size_t size, loff_t *offset)
{
	int err;
	unsigned char kern_buf[2];

	struct spi_transfer t;
	short val;

	memset(&t, 0, sizeof(t)); // 先初始化为0
	
	if (size != 2)
	{
		return -EINVAL;
	}
	/* copy_from_user */
	err = copy_from_user(&val, buf, 2);
	val <<= 2;		//保证低两位是0
	val &= 0x0fff;	//清除高4位

	kern_buf[0] = val >> 8;	//高8位
	kern_buf[1] = val;		//低8位
	/* 初始化spi_transfer */
	t.tx_buf = kern_buf;
	t.len = 2;
	/* 发起传输 */
	err = spi_sync_transfer(g_spi_device, &t, 1);

	return size;
	
}

---

请点击**左侧菜单**（移动端为**右下角**）选择要查看的所有笔记吧。