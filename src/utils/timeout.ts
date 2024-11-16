import { millisecondsFromString, type Func, type TimeUnits } from '@mustib/utils';

export function timeout<CallBack extends Func | undefined>(time: TimeUnits, callback?: CallBack) {
  return new Promise<CallBack extends Func ? ReturnType<CallBack> : void>(resolve => setTimeout(() => resolve(callback ? callback() : undefined), millisecondsFromString(time)));
}
