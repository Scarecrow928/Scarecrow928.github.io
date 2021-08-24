---
title: 右值，std::move()
date: 2021-08-24 09:46:39
tags: cpp
categories:
- cpp
---
# 左值，右值
- 左值可以位于等号左边，可以取左值的地址
- 右值只能位于等号右边，不能取右值地址

# 左值引用，右值引用
- 左值引用形式为 `int &a = b;`，a是b的别名，具有相同地址，只在创建时引用其他左值
- 右值引用形式为 `int &&a = 3;`
- 常量左值引用也可以 `const int &a = 3;`

# `std::move()`
`std::move()`的功能是将传入的左值强制转换为右值返回。

在STL的许多容器中，都定义了移动语义：
```cpp
class A {
public:
    A(const A& _a) {} // 拷贝构造
    A& operator=(const A& _a) // 赋值
    A(A&& _a) {} // 移动构造
    A& operator=(A&& _a) // 移动赋值
};

int main() {
    A a1, a2;
    a1 = A(std::move(a2)); // 调用了移动构造
    a1 = std::move(a2); // 调用了移动赋值
    exit(0);
}
```
STL中移动语义可以在某些情况下避免拷贝内存，提升性能，但是一般在`move`并赋值之后，被移动的对象会清空，相当于调用了默认构造函数。
 