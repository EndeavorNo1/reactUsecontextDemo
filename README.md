# reactUsecontextDemo
Created with CodeSandbox

一、介绍 Jotai  
Jotai 是一个原始且灵活的 React 状态管理库。  

原始：API 都是以 Hooks 方式提供，使用方式类似于 useState，useReducer  
灵活：可以组合多个 Atom 来创建新的 Atom，并且支持异步  
可以将jotai看作是 Recoil 的简化版，使用了 Atom + Hook + Context，用于解决 React 全局数据流管理的问题。  

基于发布订阅的原理，Jotai 可以实现促使 React 精确更新 Atom 所在的组件。  


