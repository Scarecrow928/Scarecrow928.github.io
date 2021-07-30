---
title: new运算符
date: 2021-07-01 08:11:35
tags: cpp
categories:
- cpp
---
## 运行原理
```cpp
A *p = new A();
delete p;
```
调用顺序：
1. `operator new`申请空间，一般STL实现中`new`申请堆内存，可重载为自定义的空间
2. 调用A的`constructor A()`，初始化内存
3. 调用A的`deconstructor ~A()`，析构内存
4. `operator delete`释放由`new`申请的空间

## `new`与`malloc()`
{% post_link apue/malloc [区别] %}
