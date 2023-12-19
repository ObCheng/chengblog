---
slug: Linux项目实战-输入管理
title: Linux项目实战-输入管理
author: 认真学习的小诚
author_title: 研究僧
author_url: https://github.com/ObCheng
author_image_url: ./chenglogo.png
description: 请输入描述
tags: [嵌入式, AI]
# activityId: 相关动态 ID
# bvid: 相关视频 ID（与 activityId 2选一）
# oid: oid
---


## 4.输入管理

为了支持同时从多个输入设备得到数据，不丢失数据，引入输入管理架构。

### 4.1 总体结构

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E8%BE%93%E5%85%A5%E7%AE%A1%E7%90%86%E6%A1%86%E6%9E%B6%E4%B8%8E%E5%87%BD%E6%95%B0%E8%B0%83%E7%94%A8%E8%BF%87%E7%A8%8B.png)

<!-- truncate -->
要想支持多个输入设备，只能使用线程: 为每个InputDevice都创建一个**“读取线程”**

### 4.2 如何避免数据丢失？

比如触摸屏，它会一下子上报很多数据

对于网络输入，也有可能同时又多个client发来数据、

所以，不能使用单一的变量来保存数据，而是使用一个数组来保存数据 — 使用**“环形缓冲区”**





### 4.3 编程

#### 输入管理的框架代码

- `void RegisterInputDevice(PInputDevice ptInputDev)`:下层调用，注册输入设备到输入管理的设备链表
- `void IntputRegisterInit(void)`：上层调用，注册所有输入设备
- `static void *input_recv_tread_func(void *data)`：内部调用，输入设备事件的接收线程函数
- `void IntputDeviceInit(void)`：上层调用，输入设备初始化，调用下层函数进行初始化。具体地，从输入管理的设备链表中找出设备，调用其初始化函数`ptInputDevtmp->DeviceInit()`，然后为其创建一个线程。
  **为何需要使用线程**？因为有两个输入设备，如果在同一个程序里面轮询，读取触摸屏时，可能会休眠，那么网络输入就会丢失；读取网络数据时，也可能会休眠，那么触摸屏数据就会丢失。所有需要为每个输入设备都创建一个线程，并且要使用锁，实现互斥地访问环形缓冲区。
- `int GetInputEvent(PInputEvent PT_InputEvent)`：上层调用，获取输入事件

```c
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>
#include <semaphore.h>
#include <string.h>
#include "input_manager.h"

static PInputDevice g_InputDevs = NULL;

/* 下层注册输入设备 */
void RegisterInputDevice(PInputDevice ptInputDev)
{
    ptInputDev->ptNext = g_InputDevs;
    g_InputDevs = ptInputDev;
}

void IntputRegisterInit(void)
{
    extern void TouchscreenRegister(void);
    extern void NetinputDevRegister(void);
    /* 注册 touchscreen */
    TouchscreenRegister();
    /* 注册 netinput */
    NetinputDevRegister();
}

static void *input_recv_tread_func(void *data)
{
    PInputDevice ptInputDev = (PInputDevice)data; //得到输入设备
    InputEvent tEvent;
    int ret;

    while (1)
    {
        //读数据
        ptInputDev->GetInputEvent(&tEvent);
        if (!ret)
        {
            //保存数据
        }
    }

    return NULL;
}

void IntputDeviceInit(void)
{
    int ret;
    pthread_t tid;
    /* 初始化所有输入设备，创建pthread */
    PInputDevice ptInputDevtmp = g_InputDevs;
    while (ptInputDevtmp)
    {
        /* 初始化设备 */
        ret = ptInputDevtmp->DeviceInit();
        if (!ret)
        {
            /* 初始化成功，就创建线程 */
            ret = pthread_create(&tid, NULL, input_recv_tread_func, ptInputDevtmp);
            if (ret)
            {
                printf("pthread_create err!\n");
                return -1;
            }
        }

        ptInputDevtmp = ptInputDevtmp->ptNext;
    }
}

int GetInputEvent(PInputEvent PT_InputEvent)
{
    /* 无数据则休眠 */

    /* 有数据就放回 */
}

```



#### 实现环形缓冲区

- 注意NEXT_POS(x)需要取余数计算
- 注意空条件与满条件的区别，以放弃一个存储位置来做区分：读写位置相同时为空，下一个写的位置等于读的位置时为满。

```c
/* start---------实现环形buffer */
#define BUFFER_LEN 20
#define NEXT_POS(x) ((x + 1) % BUFFER_LEN)
static int g_iRead = 0;
static int g_iWrite = 0;
static InputEvent g_atInputEvents[BUFFER_LEN];

static int isInputEmpty(void)
{
    return (g_iRead == g_iWrite);
}

static int isInputFull(void)
{
    return (NEXT_POS(g_iWrite) == g_iRead);
}

static void PutInputEventsToBuffer(PInputEvent ptInputEvent)
{
    if (!isInputFull())
    {
        g_atInputEvents[g_iWrite] = *ptInputEvent;
        g_iWrite = NEXT_POS(g_iWrite);
    }
}

static int GetInputEventsFromBuffer(PInputEvent ptInputEvent)
{
    if (!isInputEmpty())
    {
        *ptInputEvent = g_atInputEvents[g_iRead];
        g_iRead = NEXT_POS(g_iRead);
        return 1;
    }
    else
    {
        return 0;
    }
}

/* end---------实现环形buffer */
```



#### 线程函数与获取输入事件函数

完善线程函数`input_recv_tread_func`与获取输入事件函数`GetInputEvent`:

- GetInputEvent：上层调用此函数获取输入数据，为实现多线程对环形缓冲区资源的临界访问，需要使用互斥锁。参考`"01_all_series_quickstart\04_嵌入式Linux应用开发基础知识\source\13_thread\02_视频配套源码\pthread5.c"`代码。

```c
static pthread_mutex_t g_tMutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t g_tConVar = PTHREAD_COND_INITIALIZER;
int GetInputEvent(PInputEvent ptInputEvent)
{
    InputEvent tEvent;
    int ret;
    /* 无数据则休眠 */
    pthread_mutex_lock(&g_tMutex); //获取互斥锁
    if (GetInputEventsFromBuffer(&tEvent))	//从缓冲区获取输入事件
    {
        /* 成功获取 */
        ret = 0;
        pthread_mutex_unlock(&g_tMutex);    //释放互斥锁
    }
    else
    {
        /* 未成功获取，休眠等待 */
        pthread_cond_wait(&g_tConVar, &g_tMutex);
        if (GetInputEventsFromBuffer(&tEvent))	//唤醒后，再次获取并判断，防止数据已经被拿走
        {
            ret = 0;
        }
        else
        {
            ret = -1;
        }
        pthread_mutex_unlock(&g_tMutex);
    }
    /* 有数据就返回 */
    if (ret == 0)
        *ptInputEvent = tEvent;
    return ret;
}
```



- input_recv_tread_func：多个输入设备共用这个函数来创建不同的线程，通过传入的data转换为PInputDevice来区分；调用下层的设备提供的函数获取输入事件，成功就保存数据 - 保存数据前需要获取互斥锁，保存数据后唤醒等待数据的线程（在我们的任务中就是调用上面函数GetInputEvent的线程），然后再释放互斥锁。

```c
static void *input_recv_tread_func(void *data)
{
    PInputDevice ptInputDev = (PInputDevice)data; //得到输入设备
    InputEvent tEvent;
    int ret;

    while (1)
    {
        //读数据，没有数据它会在内部进入休眠
        ret = ptInputDev->GetInputEvent(&tEvent);
        if (!ret)
        {
            //保存数据
            pthread_mutex_lock(&g_tMutex);
            PutInputEventsToBuffer(&tEvent);

            //唤醒等待数据的线程
            pthread_cond_signal(&g_tConVar); //唤醒
            pthread_mutex_unlock(&g_tMutex);
        }
    }

    return NULL;
}
```



#### 补充

`input_manager.h`

声明函数

```c
// 下层注册输入设备
void RegisterInputDevice(PInputDevice ptInputDev);

// app
void IntputRegisterInit(void);
void IntputDeviceInit(void);
int GetInputEvent(PInputEvent PT_InputEvent);
```

struct timeval需要包含time.h

```c
#include <sys/time.h>
typedef struct InputEvent
{
    struct timeval tTime;
    int iType;
    int iX;
    int iY;
    int iPressure;
    char str[1024];
} InputEvent, *PInputEvent;
```






----

### 4.4 测试

#### main

在`unittest`目录下创建`input_test.c`

```c
#include <sys/mman.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <linux/fb.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/ioctl.h>

#include "input_manager.h"

int main(int argc, char **argv)
{
    InputEvent tEvent;
    int ret;

    IntputRegisterInit();
    IntputDeviceInit();
    while (1)
    {
        ret = GetInputEvent(&tEvent);
        if (ret)
        {
            printf("GetInputEvent err!\n");
        }
        else
        {
            if (tEvent.iType == INPUT_TYPE_NET)
            {
                printf("Type     : %d\n", tEvent.iType);
                printf("str      : %s\n", tEvent.str);
            }
            else if (tEvent.iType == INPUT_TYPE_TOUCH)
            {
                printf("Type     : %d\n", tEvent.iType);
                printf("iX       : %d\n", tEvent.iX);
                printf("iY       : %d\n", tEvent.iY);
                printf("iPressure: %d\n", tEvent.iPressure);
            }
        }
    }

    return 0;
}
```

#### 上机

(1)修改Makefile

`unittest/Makefile`

```makefile
EXTRA_CFLAGS  := 
CFLAGS_file.o := 

obj-y += input_test.o
```

`input/Makefile`

```makefile
EXTRA_CFLAGS  := 
CFLAGS_file.o := 

obj-y += touchscreen.o
obj-y += netinput.o
obj-y += input_manager.o
```

顶层目录的`Makefile`

```makefile
...
obj-y += unittest/
obj-y += input/
...
```

(2)错误：

链接错误：`/home/book/nfs_rootfs/12_intput_manager_unittest/input/input_manager.c:108: undefined reference to pthread_create`

需要在makefile中加入pthread库

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E8%BE%93%E5%85%A5%E7%AE%A1%E7%90%86-pthread%E9%93%BE%E6%8E%A5%E5%BA%93.png)



不能把**临时变量的地址赋给返回值**，应该进行**值拷贝**：

```c
int GetInputEvent(PInputEvent ptInputEvent)
{
    InputEvent tEvent;
    int ret;
    /* 无数据则休眠 */
    pthread_mutex_lock(&g_tMutex); //获取互斥锁
    if (GetInputEventsFromBuffer(&tEvent))
    {
        ret = 0;
        //释放互斥锁
        pthread_mutex_unlock(&g_tMutex);
    }
    else
    {
        /* 休眠等待 */
        pthread_cond_wait(&g_tConVar, &g_tMutex);
        if (GetInputEventsFromBuffer(&tEvent))
        {
            ret = 0;
        }
        else
        {
            ret = -1;
        }
        pthread_mutex_unlock(&g_tMutex);
    }

    if (ret == 0)
        *ptInputEvent = tEvent;			/* 错误：ptInputEvent = &tEvent;	不能把临时变量的地址赋给返回值，应该进行值拷贝	 */
    return ret;
    /* 有数据就放回 */
}
```



测试通过：

![](https://chengblog-1317157518.cos.ap-shanghai.myqcloud.com/blog/%E8%BE%93%E5%85%A5%E7%AE%A1%E7%90%86-%E4%B8%8A%E6%9C%BA%E6%B5%8B%E8%AF%95%E6%88%90%E5%8A%9F.png)



