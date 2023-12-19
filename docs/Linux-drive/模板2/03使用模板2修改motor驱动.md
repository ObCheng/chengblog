---
id: 03使用模板2修改motor驱动
title: 使用模板2修改motor驱动
sidebar_label: 使用模板2修改motor驱动
---

### 4.使用模板2修改motor驱动代码

#### 驱动程序

类似于从模板1修改到模板2，05_motor/gpio_drv.c的硬件操作相关代码不需要修改，即file_operations结构体及其相关函数不需要修改。

修改部分如下：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E6%A8%A1%E6%9D%BF2motor%E4%BB%A3%E7%A0%811.png)

之前在init函数中的工作放在probe函数里，当drv匹配到对应的

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E6%A8%A1%E6%9D%BF2motor%E4%BB%A3%E7%A0%812.png)

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E6%A8%A1%E6%9D%BF2motor%E4%BB%A3%E7%A0%813.png)

最后，在入口和出口函数中注册/注销平台驱动

```c
static const struct of_device_id gpio_dt_ids[] = {
	{ .compatible = "100ask,gpio-demo", },
	{ /* sentinel */ }
};

static struct platform_driver gpio_platform_driver = {
	.driver		= {
		.name	= "100ask_gpio_plat_drv",
		.of_match_table = gpio_dt_ids,
	},
	.probe		= gpio_drv_probe,
	.remove		= gpio_drv_remove,
};

/* 在入口函数 */
static int __init gpio_drv_init(void)
{
    /* 注册platform_driver */
	return platform_driver_register(&gpio_platform_driver);
}

/* 有入口函数就应该有出口函数：卸载驱动程序时，就会去调用这个出口函数
 */
static void __exit gpio_drv_exit(void)
{
	/* 注销platform_driver */
	platform_driver_unregister(&gpio_platform_driver);
}

/* 7. 其他完善：提供设备信息，自动创建设备节点                                     */

module_init(gpio_drv_init);
module_exit(gpio_drv_exit);

MODULE_LICENSE("GPL");
```



#### 设备树

在设备树文件

```shell
~/100ask_imx6ull-sdk/Linux-4.9.88/arch/arm/boot/dts$ vi 100ask_imx6ull-14x14.dts
```

根节点下设置

```
motor{
	compatible = "100ask,gpio-demo";
	gpios = <&gpio4 19 GPIO_ACTIVE_HIGH>, 
			<&gpio4 20 GPIO_ACTIVE_HIGH>,
			<&gpio4 21 GPIO_ACTIVE_HIGH>,
			<&gpio4 22 GPIO_ACTIVE_HIGH>;
};
```

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E6%A8%A1%E6%9D%BF2motor%E4%BF%AE%E6%94%B9%E8%AE%BE%E5%A4%87%E6%A0%91%E6%96%87%E4%BB%B6.png)

---

请点击**左侧菜单**（移动端为**右下角**）选择要查看的所有笔记吧。