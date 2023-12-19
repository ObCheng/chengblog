---
id: 01LED
title: LED
sidebar_label: LED
---

## GPIO操作

### 驱动操作GPIO

参考`03模板1-最简单的通用框架模板/GPIO子系统` 

使用LED子系统的函数。在入口函数中设置gpio为输出模式，先请求gpio然后设置。

```c
static int __init gpio_drv_init(void)
{
    int err;
    int i;
    int count = sizeof(gpios)/sizeof(gpios[0]);
    
	printk("%s %s line %d\n", __FILE__, __FUNCTION__, __LINE__);
	
	for (i = 0; i < count; i++)
	{		
		/* set pin as output */
		err = gpio_request(gpios[i].gpio, gpios[i].name);
		if (err < 0) {
			printk("can not request gpio %s %d\n", gpios[i].name, gpios[i].gpio);
			return -ENODEV;
		}
		
		gpio_direction_output(gpios[i].gpio, 1);
	}

	/* 注册file_operations 	*/
	major = register_chrdev(0, "cheng_led", &gpio_key_drv);  /* /dev/gpio_desc */

	gpio_class = class_create(THIS_MODULE, "cheng_led_class");
	if (IS_ERR(gpio_class)) {
		printk("%s %s line %d\n", __FILE__, __FUNCTION__, __LINE__);
		unregister_chrdev(major, "cheng_led_class");
		return PTR_ERR(gpio_class);
	}

	device_create(gpio_class, NULL, MKDEV(major, 0), NULL, "cheng_led"); /* /dev/100ask_gpio */
	
	return err;
}
```

在出口函数中释放gpio

```c
static void __exit gpio_drv_exit(void)
{
    int i;
    int count = sizeof(gpios)/sizeof(gpios[0]);
    
	printk("%s %s line %d\n", __FILE__, __FUNCTION__, __LINE__);

	device_destroy(gpio_class, MKDEV(major, 0));
	class_destroy(gpio_class);
	unregister_chrdev(major, "cheng_led");

	for (i = 0; i < count; i++)
	{
		gpio_free(gpios[i].gpio);		
	}
}
```

读写函数：调用gpio子系统的gpio_get_value、gpio_set_value来读取、设置gpio的值

```c
/* 实现对应的open/read/write等函数，填入file_operations结构体                   */
static ssize_t gpio_drv_read (struct file *file, char __user *buf, size_t size, loff_t *offset)
{
	char tmp_buf[2];
	int err;
    int count = sizeof(gpios)/sizeof(gpios[0]);

	if (size != 2)		//只能读两个字节，否则直接返回错误
		return -EINVAL;

	err = copy_from_user(tmp_buf, buf, 1);

	if (tmp_buf[0] >= count)
		return -EINVAL;

	tmp_buf[1] = gpio_get_value(gpios[tmp_buf[0]].gpio);

	err = copy_to_user(buf, tmp_buf, 2);
	
	return 2;
}

static ssize_t gpio_drv_write(struct file *file, const char __user *buf, size_t size, loff_t *offset)
{
    unsigned char ker_buf[2];
    int err;

    if (size != 2)
        return -EINVAL;

    err = copy_from_user(ker_buf, buf, size);
    
    if (ker_buf[0] >= sizeof(gpios)/sizeof(gpios[0]))
        return -EINVAL;

    gpio_set_value(gpios[ker_buf[0]].gpio, ker_buf[1]);
    return 2;    
}
```

### APP操作LED逻辑

- 写：buf[0] - LED编号，buf[1] - 设置电平值
- 读：buf[0] - LED编号，（驱动程序返回buf[0] - LED编号，buf[1] - 电平值）

```c
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>
#include <poll.h>
#include <signal.h>

static int fd;


//int led_on(int which);
//int led_off(int which);
//int led_status(int which);

/*
 * ./led_test <0|1|2|..>  on 
 * ./led_test <0|1|2|..>  off
 * ./led_test <0|1|2|..>
 */
int main(int argc, char **argv)
{
	int ret;
	char buf[2];

	int i;
	
	/* 1. 判断参数 */
	if (argc < 2) 
	{
		printf("Usage: %s <0|1|2|...> [on | off]\n", argv[0]);
		return -1;
	}


	/* 2. 打开文件 */
	fd = open("/dev/cheng_led", O_RDWR);
	if (fd == -1)
	{
		printf("can not open file /dev/cheng_led\n");
		return -1;
	}

	if (argc == 3)
	{
		/* write */
		buf[0] = strtol(argv[1], NULL, 0);	//把argv[1]参数（字符串）转换成一个长整数

		if (strcmp(argv[2], "on") == 0)	
			buf[1] = 0;
		else
			buf[1] = 1;
		
		ret = write(fd, buf, 2);
	}
	else
	{
		buf[0] = strtol(argv[1], NULL, 0);
		ret = read(fd, buf, 2);
		if (ret == 2)
		{
			printf("led %d status is %s\n", buf[0], buf[1] == 0 ? "on" : "off");
		}
	}
	
	close(fd);
	
	return 0;
}

```



## imx6ull gpio编号

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/imx6ull-LED%E5%BC%95%E8%84%9A.png)

查看imx6ull GPIO5_3的gpio号：注意这里的GPIO编号是从0开始的，开发板的数据手册与原理图的编号是从1开始的。所以，GPIO5_0是128，GPIO5_3就是131.

公式是 $编号(GPIOx\_n) = (x-1) \times 32 + n$

开发板操作如下：

```bash
[root@imx6ull:~]# cat /sys/kernel/debug/gpio
gpiochip0: GPIOs 0-31, parent: platform/209c000.gpio, 209c000.gpio:
 gpio-5   (                    |goodix_ts_int       ) in  hi IRQ
 gpio-19  (                    |cd                  ) in  hi IRQ
 gpio-20  (                    |spi_imx             ) out hi    

gpiochip1: GPIOs 32-63, parent: platform/20a0000.gpio, 20a0000.gpio:

gpiochip2: GPIOs 64-95, parent: platform/20a4000.gpio, 20a4000.gpio:
 gpio-68  (                    |lcdif_rst           ) out hi    

gpiochip3: GPIOs 96-127, parent: platform/20a8000.gpio, 20a8000.gpio:

gpiochip4: GPIOs 128-159, parent: platform/20ac000.gpio, 20ac000.gpio:
 gpio-130 (                    |goodix_ts_rst       ) out hi    
 gpio-134 (                    |phy-reset           ) out hi    
 gpio-135 (                    |spi32766.0          ) out hi    
 gpio-136 (                    |?                   ) out lo    
 gpio-137 (                    |phy-reset           ) out hi    
 gpio-138 (                    |spi4                ) out hi    
 gpio-139 (                    |spi4                ) out lo    

gpiochip5: GPIOs 504-511, parent: spi/spi32766.0, 74hc595, can sleep:
 gpio-505 (                    |?                   ) out hi
```

装载驱动程序，执行应用程序：

```bash
[root@imx6ull:/mnt]# insmod led_drv.ko
[root@imx6ull:/mnt]# ./led_test 0 on
[root@imx6ull:/mnt]# ./led_test 0
led 0 status is on
[root@imx6ull:/mnt]# ./led_test 0 off
[root@imx6ull:/mnt]# ./led_test 0
led 0 status is off
```



## STM32MP157 gpio编号

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/stm32mp157-LED%E5%BC%95%E8%84%9A.png)

同样

```
cat /sys/kernel/debug/gpio
```

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/stm32mp157-GPIO%E7%BC%96%E5%8F%B7%E5%AE%9A%E4%B9%89.png)

PA10编号：10
PG8编号：96+8 = 104

如果出现内核版本不匹配，可以参考《完全开发手册》重新编译下载内核到开发板。

注意PA10已经被使用为heartbeat心跳灯功能。需要修改设备树，在`~/100ask_stm32mp157_pro-sdk/Linux-5.4$ `下

```shell
vi arch/arm/boot/dts/stm32mp15xx-100ask.dtsi
```

把其中imx6ull-gpioa的定义disable掉。



编译设备树：`~/100ask_stm32mp157_pro-sdk/Linux-5.4`

```shell
make dtbs
```

替换设备树：

````shell
// Ubuntu
cp arch/arm/boot/dts/stm32mp157c-100ask-512d-lcd-v1.dtb ~/nfs_rootfs/

// 开发板
mount /dev/mmcblk2p2 /boot
cp /mnt/stm32mp157c-100ask-512d-lcd-v1.dtb  /boot
````

然后可以查看一下led的状态

```shell
cd /sys/firmware/devicetree/base/led/
cat status
```





## D1H gpio编号

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/D1H-LED%E5%BC%95%E8%84%9A.png)

这个LED的逻辑相反，高电平点亮，低电平熄灭。

查看GPIO：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/D1H-GPIO%E7%BC%96%E5%8F%B7%E5%AE%9A%E4%B9%89.png)

在`arch/risc/boot/dts/board.dts`设备树里搜索上图的红框，确定对应引脚是哪个，然后根据编号推出：

* 每个port占据32个引脚编号
* ABCD..对应0123..

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/D1H-%E8%AE%BE%E5%A4%87%E6%A0%91%E6%9F%90%E4%B8%AA%E8%AE%BE%E5%A4%87%E5%BC%95%E8%84%9A%E5%AE%9A%E4%B9%89.png)

查到PD19 – 115,PE16 – 144 ，则PE19 – 147，每组GPIO占32个编号。

公式就是(prot - ‘A’) * 32 + pin。 PD19 = 3 * 32 + 19 = 115

则PC1 = 2 * 32 + 1 = 65

---

请点击**左侧菜单**（移动端为**右下角**）选择要查看的所有笔记吧。