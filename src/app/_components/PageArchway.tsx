'use client';

interface PageArchwayProps {
  variant?: 'top' | 'frame';
  height?: number;
  dots?: number[];
}

// 原生 App 之后不再需要「假装自己是一台设备」的边框装饰。
// 保留组件签名，各房间的调用处不用改。
export default function PageArchway(_props: PageArchwayProps) {
  return null;
}
