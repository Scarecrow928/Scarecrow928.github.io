---
title: unix文件访问权限，stat fstat lstat
date: 2021-05-31 03:46:59
tags: unix
categories:
- apue
---
# 实际用户id 有效用户id 保存的设置用户id

与进程关联的id有至少6个：

| 名称 | 说明 |
| :-: | :-: |
| read id | 实际用户id，进程的运行者 |
| read group id | 实际组id，进程的运行者所在组 |
| effective user id | 有效用户id，进程文件访问权限 |
| effective group id | 有效组id，进程文件访问权限 |
| saved user id | 有效用户id的副本 |
| saved group id | 有效组id的副本 |

通常实际id不会改变，有效id等于实际id，但在某些情况下可能有效id会改变，例如运行`passwd`。

## 保存的设置用户id

某些程序，例如`at`，普通用户能够执行`at`，但`at`有时需要超级用户权限，有时候则必须以普通用户权限运行。保存的设置用户id在这时发挥效果，它可以用来判断`at`是否能将其有效用户id设置为超级用户。

`at`的所有者是超级用户`root`，并且其文件权限设置了`setuid`位，因此普通用户它运行它时：
- 实际用户id：普通用户
- 有效用户id：root
- 保存的设置用户id：root

在需要降低权限时：
- 实际用户id：普通用户
- 有效用户id：普通用户
- 保存的设置用户id：root

需要恢复特权时，保存的设置用户id指出，这个进程是能够恢复成`root`的，因为它的保存的设置用户id等于`root`！`seteuid`函数允许输入的`uid`等于保存的设置用户id，或者实际用户id：
- 实际用户id：普通用户
- 有效用户id：root，能够设置！
- 保存的设置用户id：root

# 文件访问权限
每个文件有9个访问权限位，从左至右：

| st_mode掩码 | 含义 |
| :-: | :-: |
| S_IRUSR | 拥有者读 |
| S_IWUSR | 拥有者写 | 
| S_IXUSR | 拥有者执行 |
| S_IRGRP | 组内用户读 |
| S_IWGRP | 组内用户写 |
| S_IXGRP | 组内用户执行 |
| S_IROTH | 其他用户读 |
| S_IWOTH | 其他用户写 |
| S_IXOTH | 其他用户执行 |

另外包含3位特殊位，在`ls -l`中不显示，从左至右为：

| st_mode掩码 | 含义 |
| :-: | :-: |
| S_ISUID | 执行时设置有效用户id位为拥有者 |
| S_ISGID | 执行时设置有效组id位为拥有者所在组 |
| S_ISVTX | 拥有者才能删除、重命名 |

由于`/usr/bin/passwd`在运行时能够修改用户密码等内容，也就是修改`/etc/passwd`中内容，但是`/etc/passwd`只有`root`用户才能修改。因此普通用户若需要运行`passwd`命令，就需要将`effective id`设为超级用户，于是`/usr/bin/passwd`文件设置了`S_ISUID`位：
```
$ stat /usr/bin/passwd
  File: /usr/bin/passwd
  Size: 68208           Blocks: 136        IO Block: 4096   regular file
Device: 830h/2096d      Inode: 2102        Links: 1
Access: (4755/-rwsr-xr-x)  Uid: (    0/    root)   Gid: (    0/    root)
Access: 2021-03-25 15:43:40.040000000 +0800
Modify: 2020-05-28 14:37:47.000000000 +0800
Change: 2021-03-25 15:43:25.060000000 +0800
 Birth: -
```

注意`Access: (4755/-rwsr-xr-x)`，`4755`二进制表示为
```
100 111 101 101
```
左边3位对应特殊位，右边9位为读写执行权限位，passwd程序`S_ISUID = 1`

# stat fstat lstat
`man 2 stat`中对这三个函数定义：
```c
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

int stat(const char *pathname, struct stat *statbuf);
int fstat(int fd, struct stat *statbuf);
int lstat(const char *pathname, struct stat *statbuf);
```
关于`struct stat`结构体可以直接运行`man 2 stat`查看。三个函数可用于查看文件属性，查询结果保存于`statbuff`中，`stat`与`lstat`的区别在于`lstat`不会解析链接而`stat`会。

放一个用`fstat`查看`/usr/bin/passwd`的设置有效用户id位代码
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
    int             fd_passwd = open("/usr/bin/passwd", O_RDONLY);
    struct stat     stat_passwd;
    if (-1 == fstat(fd_passwd, &stat_passwd)) {
        perror("fstat /usr/bin/passwd error");
        exit(1);
    }
    printf("/usr/bin/passwd st_mode: %x, S_ISUID: %x\n", 
        stat_passwd.st_mode, S_ISUID);

    printf("/usr/bin/passwd st_uid: %s\n", 
        (stat_passwd.st_mode & S_ISUID) ? "true" : "false");

    exit(0);
}
```
输出：
```
$ ./a.out 
/usr/bin/passwd st_mode: 89ed, S_ISUID: 800
/usr/bin/passwd st_uid: true
```