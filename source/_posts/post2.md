---
title: open openat
date: 2021-05-29 03:05:33
tags:
---

包含于`fcntl.h`
```c
// open通过绝对路径或当前目录的相对路径打开文件，返回fd
open(const char *__path, int __oflag, ...)

// openat 可以将__fd视为当前目录，__path为相对路径，也可令__fd = AT_FDCWD 使其为当前目录
// 若__path是绝对路径，__fd无效
openat(int __fd, const char *__path, int __oflag, ...)

// 两个函数出错均返回-1，errno设为错误值
```

使用例
```c
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <errno.h>
#include <unistd.h>
#include <string.h>

#define READ_BUFSIZE 256

int
main(void)
{
    int dir_fd = open(".", O_RDONLY);
    if (dir_fd < 0) {
        perror("dir open failed");
        exit(1);
    }
    int data_fd = openat(dir_fd, "data.txt", O_RDONLY);
    if (data_fd < 0) {
        perror("data.txt open failed");
        close(dir_fd);
        exit(1);
    }

    printf("dir_fd: %d, data_fd: %d\n", dir_fd, data_fd);

    char buf[READ_BUFSIZE];
    ssize_t bytes, total = 0;
    while ((bytes = read(data_fd, buf, READ_BUFSIZE)) > 0) {
        printf("byted read: %d\n", (int)bytes);
        total += bytes;
    }
    
    close(data_fd);
    close(dir_fd);
    if (bytes == -1) {
        perror("read error");
        exit(1);
    }

    printf("read from data.txt: %d bytes\n", (int)total);

    int not_exist_fd = openat(AT_FDCWD, "no_such_file.txt", O_RDONLY);
    if (not_exist_fd == -1) {
        perror("open \"no_such_file.txt\"");
    } else {
        close(not_exist_fd);
    }
    exit(0);
}
```
输出
```
$ ./a.out
dir_fd: 3, data_fd: 4
byted read: 256
byted read: 97
read from data.txt: 353 bytes
open "no_such_file.txt": No such file or directory
```