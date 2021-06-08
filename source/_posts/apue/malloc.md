---
title: malloc calloc realloc
date: 2021-06-08 06:48:38
tags: unix
categories:
- apue
---
# 定义
```c
// Linux
#include <stdlib.h>
void *malloc(size_t size);
void *calloc(size_t nmemb, size_t size);
void *realloc(void *ptr, size_t size);
void free(void *ptr);

// FreeBSD
#include <stdlib.h>
#include <malloc_np.h>
void *malloc(size_t size);
void *calloc(size_t number, size_t size);
void *realloc(void *ptr, size_t size);
void free(void *ptr);
```
# 区别

## 函数之间的区别
1. `malloc`申请的区域值不被初始化，而`calloc`会将其初始化为`0`
2. `malloc`输入为需要的字节数，`calloc`输入为对象数`nmemb`与每个对象字节数`size`
3. `realloc`为已分配的地址重新分配大小，可增可减

三个函数均通过系统调用`sbrk`实现。

## `malloc`与`new`运算符的区别 
1. `malloc`是`stdlib.h`中的库函数，而`new`是C++运算符
2. `malloc`需要指定所需字节数，`new`则由编译器推算，无需指定大小
3. `malloc`返回`void *`，后续需要自己转换类型，`new`则直接返回申请对象类型的指针
4. `malloc`申请失败时返回`NULL`，`new`则会抛出异常`std::bad_alloc`
5. `malloc`直接在堆上分配内存，`new`则在自由存储区上分配。大部分编译器用堆实现自由存储区。堆是操作系统维护的内存区域，而自由存储区是C++概念