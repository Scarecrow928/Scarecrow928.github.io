---
title: 软链接与硬链接的区别
date: 2021-06-03 03:21:35
tags: unix
categories:
- apue
---
软链接中的实际内容为指向文件的路径，而硬链接中包含原始文件的索引节点（inode）。也就是：软链接的inode与原始文件不同，而硬链接的inode与原始文件相同。

当访问软链接时，需要通过文件中的路径来访问原始文件，而硬链接直接通过inode访问即可。

在删除原始文件后，其硬链接链接计数器会减1，若减至0则删除文件数据块。软链接中指向路径不会发生变化，而原始文件路径已经不存在了，所以再次访问软链接会报错`No such file or directory`，而硬链接因为在创建时，向原始文件的硬链接计数器`st_nlink`加1了，因此删除原始文件也只是使其减1，并没有删除数据块，硬链接仍然能访问原始数据块。
```c
struct stat {
    dev_t     st_dev;         /* ID of device containing file */
    ino_t     st_ino;         /* Inode number */
    mode_t    st_mode;        /* File type and mode */
    nlink_t   st_nlink;       /* Number of hard links 硬链接计数器在这里 */ 
    uid_t     st_uid;         /* User ID of owner */
    gid_t     st_gid;         /* Group ID of owner */
    dev_t     st_rdev;        /* Device ID (if special file) */
    off_t     st_size;        /* Total size, in bytes */
    blksize_t st_blksize;     /* Block size for filesystem I/O */
    blkcnt_t  st_blocks;      /* Number of 512B blocks allocated */
    struct timespec st_atim;  /* Time of last access */
    struct timespec st_mtim;  /* Time of last modification */
    struct timespec st_ctim;  /* Time of last status change */
};
```
在shell中测试删除效果
```powershell
$ echo "something" > data
$ ln data hardlink_data # 硬链接
$ ln -s data softlink_data # 软链接

# data的inode值与hardlink_data值相同，links = 2
$ stat data
  File: data
  Size: 10              Blocks: 8          IO Block: 4096   regular file
Device: 830h/2096d      Inode: 11481       Links: 2
Access: (0644/-rw-r--r--)  Uid: ( 1000/scarecrow)   Gid: ( 1000/scarecrow)
Access: 2021-06-03 11:41:38.998538700 +0800
Modify: 2021-06-03 11:41:38.998538700 +0800
Change: 2021-06-03 11:42:27.628538700 +0800
 Birth: -
$ stat hardlink_data
  File: hardlink_data
  Size: 10              Blocks: 8          IO Block: 4096   regular file
Device: 830h/2096d      Inode: 11481       Links: 2
Access: (0644/-rw-r--r--)  Uid: ( 1000/scarecrow)   Gid: ( 1000/scarecrow)
Access: 2021-06-03 11:41:38.998538700 +0800
Modify: 2021-06-03 11:41:38.998538700 +0800
Change: 2021-06-03 11:42:27.628538700 +0800
 Birth: -

 # softlink_data的inode值与data不同
 $ stat softlink_data
  File: softlink_data -> data
  Size: 4               Blocks: 0          IO Block: 4096   symbolic link
Device: 830h/2096d      Inode: 42305       Links: 1
Access: (0777/lrwxrwxrwx)  Uid: ( 1000/scarecrow)   Gid: ( 1000/scarecrow)
Access: 2021-06-03 11:42:59.968538700 +0800
Modify: 2021-06-03 11:42:42.768538700 +0800
Change: 2021-06-03 11:42:42.768538700 +0800
 Birth: -

 $ rm data
 $ cat softlink_data
cat: softlink_data: No such file or directory
$ cat hardlink_data
something

# links 减至1了
$ stat hardlink_data
  File: hardlink_data
  Size: 10              Blocks: 8          IO Block: 4096   regular file
Device: 830h/2096d      Inode: 11481       Links: 1
Access: (0644/-rw-r--r--)  Uid: ( 1000/scarecrow)   Gid: ( 1000/scarecrow)
Access: 2021-06-03 11:47:07.268538700 +0800
Modify: 2021-06-03 11:41:38.998538700 +0800
Change: 2021-06-03 11:46:50.228538700 +0800
 Birth: -
```