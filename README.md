# reactUsecontextDemo
Created with CodeSandbox
jotai
一、介绍 Jotai
Jotai 是一个原始且灵活的 React 状态管理库。

原始：API 都是以 Hooks 方式提供，使用方式类似于 useState，useReducer
灵活：可以组合多个 Atom 来创建新的 Atom，并且支持异步
可以将jotai看作是 Recoil 的简化版，使用了 Atom + Hook + Context，用于解决 React 全局数据流管理的问题。

基于发布订阅的原理，Jotai 可以实现促使 React 精确更新 Atom 所在的组件。

二、Jotai 主要 Apis
atom 和 useAtom
作用分别是 创建原子数据 和 使用原子数据

普通 atom，返回数据和修改方法
import { atom } from 'jotai'
 
const productAtom = atom({ id: 12, name: 'good stuff' })
 
const [product, setProduct] = useAtom(productAtom)
只读atom，只返回数据
import { atom, useAtom, useAtomValue } from 'jotai'
 
const priceAtom = atom(2)
const readOnlyAtom = atom((get) => get(priceAtom) * 2)
 
const [readOnly] = useAtom(readOnlyAtom)
只写atom，只返回修改方法
import { atom, useAtom, useSetAtom } from 'jotai'
 
const writeOnlyAtom = atom(
  null,
  (get, set, update) => {
    set(priceAtom, get(priceAtom) - update.discount)
  }
)
 
const [, setWriteOnly] =  useAtom(writeOnlyAtom)
useAtomValue
作用是使用只读原子数据

import { atom, useAtom, useAtomValue } from 'jotai'
 
const priceAtom = atom(2)
const readOnlyAtom = atom((get) => get(priceAtom) * 2)
 
const readOnly = useAtomValue(readOnlyAtom)
useSetAtom
作用是使用只写原子数据

import { atom, useAtom, useSetAtom } from 'jotai'
 
const writeOnlyAtom = atom(
  null,
  (get, set, update) => {
    set(priceAtom, get(priceAtom) - update.discount)
  }
)
 
const setWriteOnly =  useSetAtom(writeOnlyAtom)
atomWithReset 和 useResetAtom
作用分别是 创建可以被重置的原子数据 和 使用可以被重置的原子数据

import { atomWithReset, useResetAtom } from 'jotai/utils'
 
const todoListAtom = atomWithReset([
  { description: 'Add a todo', checked: false },
])
const todoList = useAtomValue(todoListAtom)
const resetTodoList = useResetAtom(todoListAtom)
 
resetTodoList() // 执行 resetTodoList，todoList将会变成初始值
三、源码分析
主要分三条线进行源码分析
1. 创建 atom 的过程，分析 atom 方法的具体源码
2. 使用 atom 的过程，分析 useAtom 方法的具体源码
3. 修改 atom 并促使 react 更新渲染的过程，分析 setAtom 方法（由 useAtom 返回的）的具体源码

创建 atom 的过程
var keyCount = 0
function atom(read, write) {
  const key = `atom${++keyCount}`; // 生成 atom 的唯一key
  const config = { toString: () => key }; // atom 的初始配置，附带一个自定义的 toString方法
  if (typeof read === "function") { // read 参数可以是函数
    config.read = read;
  } else { // 当read不是函数时，则赋予默认方法
    config.init = read;
    config.read = (get) => get(config); // get方法在read被执行时传入，用来读取 atom 中的数据。
    config.write = (get, set, update) => set(config, typeof update === "function" ? update(get(config)) : update);
        // set方法在write被执行时传入，用来修改atom中的值。
  }
  if (write) { config.write = write; } // 如果有传入write，则替换默认的write方法
  return config;
}
此时可以看到，atom 方法的作用仅仅只是创建并返回了一个数据 config，config 里面的属性分别是init、read、write 以及 toString。除此以外，无任何其他操作。

使用 atom 的过程
创建 Context。使用 React.createContext 创建 Context，Context内部包含相关atom的值、订阅组件的方法、更新组件的方法等
使用 useReducer hook。将 atom 交给 useReducer，返回 atom 的值和更新渲染的方法(rerenderIfChanged)
订阅组件。使用 SUBSCRIBE_ATOM 让组件订阅该 atom。（当 atom 的值修改时，所有订阅该atom的组件都会执行 rerenderIfChanged，触发组件更新。）
返回数据和更新渲染方法。类似 useState 一样，返回 数据 和 更新方法。
具体代码：useAtom

function useAtom(atom, scope) {
  if ("scope" in atom) { // 只是一个警告信息，警告不要在atom里面设置scope
    console.warn("atom.scope is deprecated. Please do useAtom(atom, scope) instead.");
    scope = atom.scope;
  }
  const ScopeContext = getScopeContext(scope);
  /*
    在使用useAtom时，通常不会传入scope，所以scope会是undefined。
    另外，ScopeContext实际上就是通过 React.createContext 创建的Context上下文数据。
  */
  const { s: store, w: versionedWrite } = useContext(ScopeContext);
    // 使用 useContext 获取 ScopeContext 中的数据。关键数据是store。
    // store 保存 所有atom的值，订阅组件的方法，修改组件的方法等
 
    // getAtomValue 负责读取出保存在 atom 中的值
  const getAtomValue = useCallback((version2) => {
    const atomState = store[READ_ATOM](atom, version2);
    if ("e" in atomState) {
      throw atomState.e;
    }
    if ("p" in atomState) {
      throw atomState.p;
    }
    if ("v" in atomState) {
      return atomState.v;
    }
    throw new Error("no atom value");
  }, [store, atom]);
     
  // 每个 useAtom 对应一个 useReducer，用于更新值和更新页面。
  // 其实可以将 useReducer 替换成 useState 和 useEffect，这样更加容易理解“useAtom”其实就是全局性的“useState”
  const [[version, value, atomFromUseReducer], rerenderIfChanged] = useReducer(useCallback((prev, nextVersion) => {
    const nextValue = getAtomValue(nextVersion);
        // 当 rerenderIfChanged 被执行时，将会触发该reducer。进行旧数据和新数据的比较。
    if (Object.is(prev[1], nextValue) && prev[2] === atom) {
      return prev;
    }
    return [nextVersion, nextValue, atom];
  }, [getAtomValue, atom]), void 0, () => {
    const initialVersion = void 0;
    const initialValue = getAtomValue(initialVersion);
    return [initialVersion, initialValue, atom];
  });
 
  if (atomFromUseReducer !== atom) {
    rerenderIfChanged(void 0);
  }
 
  // 组件订阅 atom：原子类状态管理理念的核心就是发布订阅模式。
  useEffect(() => {
    const unsubscribe = store[SUBSCRIBE_ATOM](atom, rerenderIfChanged);
    rerenderIfChanged(void 0);
    return unsubscribe;
  }, [store, atom]);
 
 
  useEffect(() => {
    store[COMMIT_ATOM](atom, version);
  });
 
  // 相当于 setState 方法。负责更新 atom 值。
  const setAtom = useCallback((update) => {
    if (isWritable(atom)) {
      const write = (version2) => store[WRITE_ATOM](atom, update, version2);
      return versionedWrite ? versionedWrite(write) : write();
    } else {
      throw new Error("not writable atom");
    }
  }, [store, versionedWrite, atom]);
  useDebugValue(value);
  return [value, setAtom];
}
修改 atom 并促使 react 更新渲染的过程
执行 useAtom 返回的 setAtom
setAtom 首先更新相对应 atom 的值，然后触发页面更新。
const writeAtom = (writingAtom, update, version) => {
  const promiseOrVoid = writeAtomState(version, writingAtom, update);// 修改 atom 的值，同时将订阅该atom的组件的更新方法(rerenderIfChanged)放入pendingMap保存
  flushPending(version); // 取出pendingMap的所有更新方法，逐个执行，从而触发 React 更新渲染页面。
  return promiseOrVoid;
};
四、与实际项目结合
请求表格数据
1.创建存放 tableData 的 atom

import { atom } from 'jotai'
export const tableDataAtom = atom([], async (get, set) => {
  set(
    tableFormDataAtom,
    (prev: ExtractAtomValue<typeof tableFormDataAtom>) => ({ ...prev, loading: true }),
  )
  const { brand } = get(routerParamsAtom)
  const { tagShowType, site } = get(searchFormDataAtom)
  const { rowsPerPage, currentPage } = get(tableFormDataAtom)
  try{
    const { code, data }: TResponce<TTableData> = await request({
      url: apis.getTagShowData,
      method: 'get',
      params: {
        product: brand,
        size: rowsPerPage,
        current: +currentPage + 1,
        site,
        tagShowType,
      },
    })
    if (+code === 1000) {
      set(tableDataAtom, data.records)
      set(
        tableFormDataAtom,
        (prev: ExtractAtomValue<typeof tableFormDataAtom>) => ({ ...prev, total: data.total, loading: false }),
      )
    }
  } catch(error){
    console.log(error)
    return []
  }
})
 
// 添加 onMount，让 tableDataAtom 被首次使用时，自动请求数据
tableDataAtom.onMount = (setAtom) => {
  setAtom()
}
2.使用 tableDataAtom

import * as atoms from './jotai/atoms'
const [tableData, updateTableData] = useAtom(atoms.tableDataAtom)
请求选项数据
1.创建存放 selectOptions 的 atom

import { atom } from 'jotai'
const selectOptionsAtom = atom(async (get) => {
  const { brand } = get(routerParamsAtom)
  const { site } = get(tableDialogFormDataAtom)
  if (site) {
    try {
      const res: TResponce<any> = await request({
        url: apis.getMallList,
        method: 'get',
        params: {
          product: brand,
          site,
          queryType: 1,
        },
      })
      return res.data
    } catch (error) {
      console.log(error)
      return []
    }
  }
  return []
})
2.使用 selectOptionsAtom

import * as atoms from './jotai/atoms'
const [selectOptions, setSelectOptions] = useAtom(atoms.selectOptionsAtom)
五、为什么选择 Jotai
1. 提高开发效率
现如今使用的 react-redux-saga，创建一个全局数据，可能需要5步：
1. 使用 createAction 创建 action
2. 创建 saga 方法（在这里面请求数据）
3. 使用 take 连接 action 和 saga
4. 使用 useSelector 获取对应 redux 数据
5. 使用 useDispatch 包装对应 action

然而，jotai，只需要两步：
1. 创建 atom，将具体请求或者派生数据放入
2. useAtom 使用 atom

开发效率方面显著提高

2. jotai 完全基于 React 原生 api 实现，与 React 更加契合。
3. 方便未来升级 React 18
在 React 18 发布计划公布以后，React官方发了一篇公告(https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Freactwg%2Freact-18%2Fdiscussions%2F70)来说明第三方库对 Concurrent Mode 的影响和修改建议。
影响：诸如 redux、mobx 这类状态管理库是需要脱离于 react 创建一个外部状态进行管理，在 Concurrent Mode 模式下，组件的渲染有可能被中断，但外部状态的修改却无法被中断，那么当重新渲染该组件时，将会发生外部状态与第一次渲染不一致的情况，从而造成re-render，影响性能。
解决：使用React内置的状态 hooks 和 context，就可以让组件 render 一致 的 UI，从而使 React 18 发挥最高性能。
