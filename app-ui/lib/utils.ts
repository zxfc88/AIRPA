/**
 * 通用工具函数
 *
 * cn() — 合并 Tailwind CSS 类名，自动处理冲突
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 CSS 类名，tailwind-merge 自动消除冲突
 * @param inputs - 任意数量的类名参数
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
