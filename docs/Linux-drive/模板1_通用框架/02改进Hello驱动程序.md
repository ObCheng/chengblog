---
id: 02改进Hello驱动程序
title: 改进Hello驱动程序
sidebar_label: 改进Hello驱动程序
---



## APP使用驱动的4种方式

- 非阻塞：直接返回
- 阻塞：休眠-唤醒
  - 我们之前编写hello驱动程序是非阻塞的，程序直接返回。但是也可以使用阻塞模式，没有读取到数据就进入休眠状态。使用中断来实现这个过程：比如某个按键中断，在它的中断函数种负责唤醒这个休眠的函数，然后就可以读取数据了。
    ![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E4%BC%91%E7%9C%A0%E5%94%A4%E9%86%92.png)
- poll：定个闹钟
  - 应用程序调用内核的`poll/select`函数，导致驱动程序的drv_poll函数被调用
  - 驱动程序drv_poll中进行判断流程如下：
    - 是否就绪，是：立刻返回OK；否：返回，在内核进入休眠schedule_timeout()。
    - 谁唤醒？1.时间到 2.发送了中断
    - 再看一眼，是否就绪？返回OK，或者超时
- 异步通知
  ![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E5%BC%82%E6%AD%A5%E9%80%9A%E7%9F%A5.png)



## 字符设备的另一种注册方式cdev

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E4%B8%A4%E7%A7%8D%E6%B3%A8%E5%86%8C%E5%AD%97%E7%AC%A6%E7%A8%8B%E5%BA%8F%E6%96%B9%E5%BC%8F(2).png)

### 原先的方法

03_hello_drv_cdev

使用register_chrdev注册字符设备程序：

```c
static int __init hello_init(void)
{
    major = register_chrdev(0, "hello_drv", &hello_drv);

    hello_class = class_create(THIS_MODULE, "hello_class");
    if (IS_ERR(hello_class))
    {
        printk("failed to allocate class\n");
        return PTR_ERR(hello_class);
    }
		
    device_create(hello_class, NULL, MKDEV(major, 0),
			      NULL, "hello");   /* /dev/hello */
    
    return 0;
}
```

这种方法只关注主设备号，访问到的总是hello_drv驱动。但是主设备号只有255，如果由很多设备会导致不够用，并且该驱动程序会“霸占”该主设备号下的所有次设备号。（在嵌入式开发里面基本上够用）

---

### 新方法

1.分配设备号，**申请一个主次设备号的空间**

```c
int register_chrdev_region(dev_t from, unsigned count, const char *name)
```

函数必须提供主设备号，from表示从哪里开始，即主设备号，count表示所请求的连续设备编号的个数。



```c
int alloc_chrdev_region(dev_t *dev, unsigned baseminor, unsigned count,
			const char *name)
```

自动分配主设备号和次设备号，记录在传入的dev中，baseminor表示次设备号开始值，count表示所请求的连续设备编号的个数。
如baseminor = 0，count = 2，表示从次设备号0开始占据2个次设备号

2.初始化字符设备结构体cdev，**将其与file_operations结构体挂钩**
3.将cdev添加到内核对应设备号dev中

```c
static struct cdev hello_cdev;

void cdev_init(struct cdev *cdev, const struct file_operations *fops)
int cdev_add(struct cdev *cdev, dev_t dev, unsigned count)	//dev是第一个设备的编号，我们上面使用alloc_chrdev_region分配的，count表示与之关联的设备编号数量
```

如cdev_add(cdev, dev, 2)，则表示有两个次设备号对应这个驱动程序

4.出口函数中

```c
cdev_del(&hello_cdev); 	//删除字符设备,与cdev_init/cdev_add对应
unregister_chrdev_region(dev, 1);	//销毁申请的主次设备号，与alloc_chrdev_region对应
```



```c
static int __init hello_init(void)
{
    int ret;

    // register chrdev
    ret = alloc_chrdev_region(&dev, 0, 1, "hello");
    
    if(ret < 0)
    {
        printk(KERN_ERR "alloc_chrdev_region() failed for hello\n");
        return -EINVAL;
    }

    cdev_init(&hello_cdev, &hello_drv);
    ret = cdev_add(&hello_cdev, dev, 1);
    if (ret)
    {
        printk(KERN_ERR "cdev_add() failed for hello\n");
        return -EINVAL;
    }

    // create device

    hello_class = class_create(THIS_MODULE, "hello_class");
    if (IS_ERR(hello_class))
    {
        printk("failed to allocate class\n");
        return PTR_ERR(hello_class);
    }
		
    device_create(hello_class, NULL, dev, NULL, "hello");   /* /dev/hello */
    
    return 0;
}
```



---

请点击**左侧菜单**（移动端为**右下角**）选择要查看的所有笔记吧。