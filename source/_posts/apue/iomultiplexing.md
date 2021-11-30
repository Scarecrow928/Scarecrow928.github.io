---
title: IO多路复用
date: 2021-06-21 11:04:24
tags: unix
categories:
- apue
---
## select
`select`函数，可以传入想观察的`fd_set`类型的三个集合，分别表示读、写、异常的fd。`nfds`表示监听的最大fd值+1，可以设置为`FD_SETSIZE`表示最大值。

返回已就绪的fd数量，它是三个集合中已就绪的fd数之和。

select对于`n`个fd，其时间复杂度为`O(n)`
```c
 #include <sys/select.h>
int select(int nfds, fd_set *readfds, fd_set *writefds,
            fd_set *exceptfds, struct timeval *timeout);
```

## poll
`poll`函数与`select`类似，不过不分成3个fd集合，而合并成一个`pollfd`结构。`event`表示关心的事件，例如读、写。`revent`表示返回的事件，其中除了包含关心的时间外，还包含了fd是否出错、挂断、是否打开一个文件等。

`poll`同样具有`O(n)`时间复杂度
```c
#include <poll.h>
int poll(struct pollfd *fds, nfds_t nfds, int timeout);

struct pollfd {
    int   fd;         /* file descriptor */
    short events;     /* requested events */
    short revents;    /* returned events */
};
```

## epoll
`select poll` 都采用轮询fd的方式确认是否有IO准备就绪，在网络中，如果fd数量非常多，则效率比较低下。

epool中，每个fd对应一个回调函数，当IO就绪时，对应的fd调用回调函数，将fd加入一个链表，epoll会检查这个链表，若有fd已就绪，则在`epoll_wait`函数处返回。

epoll有两种模式
- LT模式下，fd就绪，被读取后，如果fd中还有未读完的信息，则epoll会将它放回链表，下次还会报告这个fd
- ET模式，fd就绪，被读取后，就算有未读完的信息，epoll也不再监听这个fd，因此必须每次读完fd中的内容。这种方式效率更高。

#### epoll示例
可以接受多个TCP请求，并输出每个连接中读出的内容。

- 使用了ET模式，客户端socket必须为非阻塞模式
- `struct events`中data成员可以理解为每个fd的上下文，在代码中将其设置为指针，指向堆中的`struct Context`。必须注意连接关闭后，`delete`掉对应内存。

结构体的定义：
```cpp
struct epoll_event
{
  uint32_t events;	/* Epoll events */
  epoll_data_t data;	/* User data variable */ 
} 

typedef union epoll_data
{
  void *ptr;
  int fd;
  uint32_t u32;
  uint64_t u64;
} epoll_data_t;
```
```cpp
#include <sys/epoll.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <fcntl.h>
#include <unistd.h>
#include <signal.h>

#include <string>

#define MAX_EVENTS 16
#define READ_SIZE 4096

int epollfd;

static void sigint_handler(int signo) {
    printf(" %d received.\n", signo);
    close(epollfd);
    exit(0);
}

// 每个fd所关联的上下文
typedef struct Context {
    std::string ip;
    uint16_t port;
    int fd;
    Context(const std::string &_ip, uint16_t _port, int _fd) :
        ip(_ip), port(_port), fd(_fd) {}
} Context;

int main(int argc, char * argv[]) {
    int listen_sock, conn_sock, nfds;
    struct epoll_event ev, events[MAX_EVENTS];

    struct sockaddr_in sa;
    sa.sin_family = AF_INET;
    inet_pton(AF_INET, "0.0.0.0", &sa.sin_addr.s_addr);
    sa.sin_port = htons(19000);

    listen_sock = socket(AF_INET, SOCK_STREAM, 0);
    if (-1 == bind(listen_sock, (struct sockaddr *)&sa, sizeof(sa))) {
        perror("bind");
        exit(EXIT_FAILURE);
    }

    if (-1 == listen(listen_sock, 1024)) {
        perror("listen");
        exit(EXIT_FAILURE);
    }

    // 来自epoll手册的建议框架
    epollfd = epoll_create(MAX_EVENTS);
    if (epollfd == -1) {
        perror("epoll_create");
        exit(EXIT_FAILURE);
    }
    ev.events = EPOLLIN;
    ev.data.fd = listen_sock;
    if (epoll_ctl(epollfd, EPOLL_CTL_ADD, listen_sock, &ev) == -1) {
        perror("epoll_ctl: listen_sock");
        exit(EXIT_FAILURE);
    }

    for (;;) {
        int nfds = epoll_wait(epollfd, events, MAX_EVENTS, 300);
        if (nfds == -1) {
            perror("epoll_wait");
            exit(EXIT_FAILURE);
        }

        for (int n = 0; n < nfds; ++n) {
            if (events[n].data.fd == listen_sock) {
                // 收到连接请求
                struct sockaddr_in addr;
                uint32_t addrlen = sizeof(addr);
                conn_sock = accept4(listen_sock, (struct sockaddr *) &addr, &addrlen, SOCK_NONBLOCK);
                if (conn_sock == -1) {
                    perror("accept");
                    exit(EXIT_FAILURE);
                }

                char charip[20];
                inet_ntop(AF_INET, &addr.sin_addr.s_addr, charip, 20);
                std::string ip(charip);
                uint16_t port = ntohs(addr.sin_port);
                printf("accept: %s:%d\n", ip.data(), port);
                fflush(stdout);

                ev.events = EPOLLIN | EPOLLET;
                ev.data.ptr = (void *)new Context(ip, port, conn_sock);
                if (epoll_ctl(epollfd, EPOLL_CTL_ADD, conn_sock, &ev) == -1) {
                    perror("epoll_ctl: conn_sock");
                    exit(EXIT_FAILURE);
                }
            } else if (events[n].events == EPOLLIN) {
                // fd可读
                Context *ctx = (Context *)events[n].data.ptr;
                std::string row_request;
                char buf[READ_SIZE];
                int read_n;
                while ((read_n = recv(ctx->fd, buf, READ_SIZE - 1, 0)) > 0) {
                    buf[read_n] = '\0';
                    row_request += std::string(buf);
                }

                if (row_request.size() == 0) {
                    // 读取大小为0代表客户端关闭
                    printf("%s:%u closed.\n", ctx->ip.data(), ctx->port);
                    fflush(stdout);
                    close(ctx->fd);
                    delete ctx;
                } else {
                    printf("from %s:%u recv %lu bytes, content: %s\n", ctx->ip.data(), ctx->port,
                           row_request.size(), row_request.data());
                    fflush(stdout);
                }
            }
        }
    }
    for (auto &e : events) {
        if (e.data.ptr)
            delete (Context *)e.data.ptr;
    }
    close(epollfd);

    return 0;
}

```