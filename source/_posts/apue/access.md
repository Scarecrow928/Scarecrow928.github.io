---
title: access open的区别
date: 2021-05-31 17:47:51
tags: unix
categories:
- apue
---
# access open的区别
摘自*Linux Programmer's Manual*中access函数DESCRIPTION节

> The  check is done using the calling process's <font size=4>**real UID and GID**</font>, rather than the effective IDs as is done when
actually attempting an operation (e.g., open(2)) on the file.  Similarly, for the root user,  the  check  uses
the  set  of permitted capabilities rather than the set of effective capabilities; and for non-root users, the
check uses an empty set of capabilities.

可以看到`access`系统调用在检测进程对文件的访问权限时，使用的是进程实际用户id和组id。而`open`系统调用使用的是有效id，大部分情况下它们的表现没有区别，而若有效id与实际id不同时，则会出现访问权限区别。

APUE书中给了一个例子，略作修改后如下：

```c
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>

int
main(void)
{
    // 通过实际id访问文件
    if (-1 == access("file.txt", R_OK))
        perror("access");
    else
        printf("access成功\n");

    // 通过有效id访问文件
    if (-1 == open("file.txt", O_RDONLY))
        perror("open");
    else
        printf("open读成功\n");
    exit(0);
}
```
在shell中测试它的行为
```powershell
# 编译完成的后的文件为a.out，目录下存在一个file.txt文件用于测试

$ ls -l file.txt
-r-------- 1 root root 0 Jun  1  2021 file.txt
# file.txt文件属于root用户，仅root拥有读权限

$ ls -l a.out
-rwxr-xr-x 1 root root 16864 Jun  1  2021 a.out
# a.out可执行文件属于root用户，所有用户均可执行它

$ ./a.out
access: Permission denied
open: Permission denied
# 以普通用户身份执行a.out，access open均无法访问file.txt
# 因为此时进程的 有效id、实际id 均为 "scarecrow"

$ sudo chmod u+s a.out
$ ls -l a.out
-rwsr-xr-x 1 root root 16864 Jun  1  2021 a.out
# 给a.out设置上"S_ISUID"位，在执行a.out时，有效id会被设置成a.out的所有者，本例中为root

$ ./a.out
access: Permission denied
open读成功
# access 使用实际id (scarecrow) 访问，依然无法读取
# open 使用有效id (root) 访问，能读取
```
