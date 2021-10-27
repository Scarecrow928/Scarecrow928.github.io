---
title: DBSCAN算法实现
date: 2021-10-27 09:31:48
tags: ML algorithm
---
## DBSCAN算法
支持二维坐标点聚类，参考：[密度聚类算法DBSCAN](https://zhuanlan.zhihu.com/p/23504573)

```python
import numpy as np
import matplotlib.pyplot as plt

# eps: 邻域半径
# MinPts: 核心样本的邻域中最少点数目
class Dbscan:
    def __init__(self, eps: int = 5, MinPts: int = 3):
        self.eps = eps
        self.MinPts = MinPts
        self.points = None
        self.group = None
        self.group_counter = 1

    def get_neighbors(self, idx: int):
        neighbors = ((self.points - self.points[idx]) ** 2).sum(axis=1) <= (self.eps ** 2)
        neighbors[idx] = False
        return neighbors

    def expand(self, idx: int):
        if self.group[idx] != 0:
            return
        self.group[idx] = self.group_counter
        neighbors = self.get_neighbors(idx)
        if neighbors.sum() >= self.MinPts:
            for i, is_neighbor in enumerate(neighbors):
                if not is_neighbor:
                    continue
                self.expand(i)

    def fit(self, points: np.array):
        self.points = points
        self.group = np.zeros(points.shape[0], dtype=np.int32)
        for idx, p in enumerate(self.points):
            if self.group[idx] != 0:
                continue
            neighbors = self.get_neighbors(idx)
            if neighbors.sum() >= self.MinPts:
                self.expand(idx)
                self.group_counter += 1
        return self.group

# 随机生成二维坐标点
points = np.random.rand(150, 2) * 100

# 调参比较效果
grp = Dbscan().fit(points)
plt.scatter(points[:, 0], points[:, 1], c=grp)
plt.show()

# 邻域中要求的点数目越多，形成的聚簇数目越少
grp = Dbscan(eps=10, MinPts=6).fit(points)
plt.scatter(points[:, 0], points[:, 1], c=grp)
plt.show()
```
`eps=10, MinPts=5`输出
![](/images/dbscan1.png)

`eps=10, MinPts=6`输出
![](/images/dbscan2.png)