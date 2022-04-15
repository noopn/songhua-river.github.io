---
layout: posts
title: Highcharts wrapper for React
mathjax: true
date: 2022-04-14 13:46:40
categories:
  - React
tags:
  - React
---


#### 简介

一个非常精简的包装工具,可以在 React 项目中使用 highcharts


#### 源码分析

服务端渲染的时候 `useLayoutEffect` 会抛出警告,所以需要按条件使用,如果是浏览器环境使用 `useLayoutEffect`,如果是服务器环境使用 `useEffect`

使用 `useLayoutEffect` 可以保证在布局阶段, ref 所指向的挂载元素是可以使用的,也可以用在一个父组件的 `componentDidMount`

```ts

// 区分浏览器环境还是
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;


// 使用 forwardRef 转发 ref, 将 ref 传递到子组件
// 如果有需要可以通过传入 ref 属性,获取到挂载节点的真是DOM元素
// 也可以配合 useImperativeHandle 使用
const HighchartsReact = forwardRef(
  function HighchartsReact(props, ref) {

    const containerRef = useRef();
    const chartRef = useRef();

    useIsomorphicLayoutEffect(() => {
      function createChart() {
        const H = props.highcharts || (
          typeof window === 'object' && window.Highcharts
        );

        // 暴露参数,用于表明实例化图表类型
        const constructorType = props.constructorType || 'chart';

        if (!H) {
          console.warn('The "highcharts" property was not passed.');

        } else if (!H[constructorType]) {
          console.warn(
            'The "constructorType" property is incorrect or some ' +
              'required module is not imported.'
          );

        // options 必填参数,如果没有提示警告
        } else if (!props.options) {
          console.warn('The "options" property was not passed.');

        } else {
          // 创建图表实例
          chartRef.current = H[constructorType](
            containerRef.current,
            props.options,
            props.callback ? props.callback : undefined
          );
        }
      }

      if (!chartRef.current) {
        createChart();
      } else {
        // 是否允许图表更新,如果为假,在接受到新的 props 之后会直接忽略掉
        if (props.allowChartUpdate !== false) {
          // immutable 用于指定是否使用不可变数据
          // 本质就是不会再原有的图表上更新,而会直接创建新图表的实例
          if (!props.immutable && chartRef.current) {
            chartRef.current.update(
              props.options,
              // 与用指定原生的更新参数,由 highcharts 自己提供
              ...(props.updateArgs || [true, true])
            );
          } else {
            createChart();
          }
        }
      }
    });

    useIsomorphicLayoutEffect(() => {
      return () => {
        // 组件卸载的时候注销实例
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      };
    }, []);


    
    // 一般配合 forwardRef 使用
    // 可以用于暴露封装组件内部的状态
    // 通过 ref.current.chart 或 ref.current.chart 可以在外部获取到组件实例,以及挂载节点
    useImperativeHandle(
      ref,
      () => ({
        get chart() {
          return chartRef.current;
        },
        container: containerRef
      }),
      []
    );

    // Create container for the chart
    return <div { ...props.containerProps } ref={ containerRef } />;
  }
);

export default memo(HighchartsReact);
```
