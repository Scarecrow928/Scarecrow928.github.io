---
title: TCP协议
date: 2021-06-27 07:12:22
tags: unix 网络 TCP
categories:
- unp
---
# TCP协议

## 建立连接
建立连接一般由客户端发起，共3步：
- 客户端发送SYN j
- 服务端回复SYN k, ACK j +1，客户端收到后客户端认为连接建立
- 客户端回复 ACK k + 1，服务端收到后服务端认为连接建立

图片来自《UNP》
![](/images/tcp_connect.jpg)

## 终止连接
终止连接两端都可以主动发起，假设A主动向B发起，共4步：
- A发送FIN M
- B回复ACK M + 1，B关闭读，A关闭写
- B发送FIN N
- A回复ACK N + 1 B关闭写，A关闭读

图片来自《UNP》
![](/images/tcp_close.jpg)

## 状态转移
### 客户端
初始为CLOSED
1. SYN_SENT： 发送SYN
2. ESTABLISHED：收到ACK，发送SYN ACK
3. FIN_WAIT_1：发送FIN，主动关闭
4. FIN_WAIT_2：收到ACK
5. TIME_WAIT：收到FIN，发送ACK
6. CLOSED：超时

### 服务端
初始为CLOSED
1. LISTEN：被动打开
2. SYN_RCVD：收到SYN，发送ACK
3. ESTABLISHED：发送SYN ACK
4. CLOSE_WAIT：收到FIN，发送ACK，被动关闭
5. LAST_ACK：发送FIN
6. CLOSED：收到ACK

图片来自《UNP》
![](/images/tcp_status.jpg)

## TCP可靠性机制
1. 序列号、确认应答、超时重传
每个数据包有序列号，如果没收到确认，发送方在超时后会重传

2. 滑动窗口
窗口内的数据包都可以立刻发送，最早发送的包被确认后，窗口向前滑动

3. 拥塞控制
慢启动：窗口初始大小为1，每次收到确认，窗口大小乘2
拥塞避免：设置窗口大小阈值，达到阈值后，不再乘2，改为增加1；发生超时重传时，阈值除以二，窗口设置为1，重新慢启动