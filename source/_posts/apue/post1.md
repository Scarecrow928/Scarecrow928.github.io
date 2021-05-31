---
title: sysconf pathconf fpathconf
date: 2021-05-28 08:04:40
tags: unix
categories:
- apue
---

包含于 `unistd.h`
```c
// 查看系统配置信息，对于不同unix系统结果可能不同
long sysconf(int name);
long pathconf(const char *pathname, int name);
long fpathconf(int fd, int name);
```

使用例
```c
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <unistd.h>
#include <limits.h>

int
main(void)
{
#ifdef ARG_MAX
    printf("ARG_MAX: %ld", (long)ARG_MAX);
#else
    printf("ARG_MAX undefined\n");
#endif
#ifdef _SC_ARG_MAX
    printf("_SC_ARG_MAX: %ld\n", (long)sysconf(_SC_ARG_MAX));
#else
    printf("_SC_ARG_MAX undefined\n");
#endif

#ifdef LINK_MAX
    printf("MAX_CANON: %ld", (long)LINK_MAX);
#else
    printf("LINK_MAX undefined\n");
#endif
#ifdef _PC_LINK_MAX
    printf("_PC_LINK_MAX: %ld\n", (long)pathconf("/", _PC_LINK_MAX));
#else
    printf("_PC_LINK_MAX undefined\n");
#endif
    exit(0);
}
```
输出
```shellsession
$ ./a.out
ARG_MAX undefined
_SC_ARG_MAX: 2097152
LINK_MAX undefined
_PC_LINK_MAX: 65000
```