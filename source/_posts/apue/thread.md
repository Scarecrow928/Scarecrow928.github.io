---
title: 线程库pthread（1）
date: 2021-06-16 11:42:45
tags: unix pthread
categories:
- apue
---
# 线程
这部分APUE没有详细介绍，资料来自网络
## 线程生命周期
![](/images/thread_lifecycle.jpg)

## 进程，线程，协程
- 进程是资源分配的最小单位，例如全局变量、代码段、堆、栈等。

- 线程是系统调度的最小单位，线程之间共享进程的资源。

- 协程可以理解为用户层的线程，其调度不由操作系统进行而由用户应用进行，相比线程更加轻量。

# pthread使用
编译使用了pthread的程序时，需要输入`cc -pthread xxx.c`
## pthread_t
线程标识符，linux上实现为`unsigned long`，可以直接打印

## pthread_create
创建一个线程，立即开始执行，参数分别为：
- 线程id
- 线程属性
- 任务函数
- 函数参数，可以传入结构体表示多个参数
```c
int pthread_create(pthread_t *thread, const pthread_attr_t *attr,
    void *(*start_routine) (void *), void *arg);
```
## pthread_exit
正常退出线程，也可以在线程里返回以终止线程
```c
void pthread_exit(void *retval);
```
## 线程同步机制
### pthread_mutex_t
互斥锁，只能有一个线程获得互斥锁，若获取不到`lock`将阻塞，`trylock`返回` EBUSY`
```c
int pthread_mutex_init(pthread_mutex_t *restrict mutex,
        const pthread_mutexattr_t *restrict attr);

// 如果不用堆内存，可以这样初始化
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;

int pthread_mutex_lock(pthread_mutex_t *mutex);
int pthread_mutex_trylock(pthread_mutex_t *mutex);
int pthread_mutex_unlock(pthread_mutex_t *mutex);
```

### pthread_rwlock_t
读写锁，读写之间互斥，写之间互斥，读之间不互斥。也有`trylock` 版本
```c
int pthread_rwlock_init(pthread_rwlock_t *restrict rwlock,
        const pthread_rwlockattr_t *restrict attr);

int pthread_rwlock_rdlock(pthread_rwlock_t *rwlock);
int pthread_rwlock_wrlock(pthread_rwlock_t *rwlock);
int pthread_rwlock_unlock(pthread_rwlock_t *rwlock);
```
### <font color=red>pthread_cond_t</font>
条件变量，有点类似进程控制中的`sigsuspend`，等待特定信号到达后继续运行。发送信号可以单播也可以广播
```c
int pthread_cond_init(pthread_cond_t *restrict cond,
    const pthread_condattr_t *restrict attr);

// 线程开始等待条件到达
int pthread_cond_wait(pthread_cond_t *restrict cond,
    pthread_mutex_t *restrict mutex);

// 发送信号，唤醒等待条件的线程
int pthread_cond_signal(pthread_cond_t *cond);
int pthread_cond_broadcast(pthread_cond_t *cond);
```

条件变量需要用`mutex`保护，一个模板写法：
```c
// 全局mutex，用于同步各线程，保护条件
pthread_mutex_t mutex;

// 我是否可以行动的条件
pthread_cond_t cond; 

// 模板 
pthread_mutex_lock(&mutex);
while (/* 条件没达成吗 */)
    pthread_cond_wait(&cond, &mutex);
/* 临界区代码在此 */
pthread_mutex_unlock(&mutex);
// 非临界区
```
这是一个等待条件的线程的模板，当线程发现还没轮到它运行，会挂起，直到有一个其他线程发出了`pthread_cond_signal(&cond)`，并且`mutex`可以获取，线程才能从`pthread_cond_wait`返回。

这种方式避免了使用自旋锁。若使用自旋锁，CPU会因为重复判断条件而一直处于高负荷状态，对系统整体效率影响很大。

### pthread_barrier_t
屏障，必须在指定个数线程到达屏障后，这些线程才能继续运行，`count`表示线程数

注意，屏障可以重复使用，每次都会等待`count`个线程到达后放行，不需要重复初始化

```c
int pthread_barrier_init(pthread_barrier_t *restrict barrier,
    const pthread_barrierattr_t *restrict attr, unsigned count);
```