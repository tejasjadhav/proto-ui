import { Dispatch } from 'redux';
import { setTheme } from '../actions/tabs';

export default function addDarkModeEventListener(dispatch: Dispatch) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ev => {
    if (ev.matches) {
      dispatch(setTheme('dark'));
    } else {
      dispatch(setTheme('light'));
    }
  });
}
