/* @flow */

import { isPlainObject } from 'is-plain-object';
import { isValidElement } from 'react';
import { ForwardRef, Memo } from 'react-is';
import type { Options } from './../options';
import parseReactElement from './../parser/parseReactElement';
import formatComplexDataStructure from './formatComplexDataStructure';
import formatFunction from './formatFunction';
import formatTreeNode from './formatTreeNode';

const escape = (s: string): string => s.replace(/"/g, '&quot;');

const formatPropValue = (
  propValue: any,
  inline: boolean,
  lvl: number,
  options: Options
): string => {
  if (typeof propValue === 'number') {
    return `{${String(propValue)}}`;
  }

  if (typeof propValue === 'string') {
    return `"${escape(propValue)}"`;
  }

  // > "Symbols (new in ECMAScript 2015, not yet supported in Flow)"
  // @see: https://flow.org/en/docs/types/primitives/
  // $FlowFixMe: Flow does not support Symbol
  if (typeof propValue === 'symbol') {
    const symbolDescription = propValue
      .valueOf()
      .toString()
      .replace(/Symbol\((.*)\)/, '$1');

    if (!symbolDescription) {
      return `{Symbol()}`;
    }

    return `{Symbol('${symbolDescription}')}`;
  }

  if (typeof propValue === 'function') {
    return `{${formatFunction(propValue, options)}}`;
  }

  if (isValidElement(propValue)) {
    return `{${formatTreeNode(
      parseReactElement(propValue, options),
      true,
      lvl,
      options
    )}}`;
  }

  // handle memo & forwardRef
  if (
    isPlainObject(propValue) &&
    (propValue.$$typeof === Memo || propValue.$$typeof === ForwardRef)
  ) {
    // render = forwardRef
    // type = memo
    const target = propValue.render || propValue.type;

    // go deeper if necessary
    return target.$$typeof
      ? formatPropValue(target, inline, lvl, options)
      : `{${propValue.displayName || target.name || 'Component'}}`;
  }

  if (propValue instanceof Date) {
    if (isNaN(propValue.valueOf())) {
      return `{new Date(NaN)}`;
    }
    return `{new Date("${propValue.toISOString()}")}`;
  }

  if (isPlainObject(propValue) || Array.isArray(propValue)) {
    return `{${formatComplexDataStructure(propValue, inline, lvl, options)}}`;
  }

  return `{${String(propValue)}}`;
};

export default formatPropValue;
