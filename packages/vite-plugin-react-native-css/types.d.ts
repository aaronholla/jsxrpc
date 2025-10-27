// import type { ReactNativeCssStyleSheet } from "react-native-css/compiler";

declare module "*.rncss" {
  // export const native: ReactNativeCssStyleSheet;
  // export const web: string;
  const src: {
    native: any;
    web: string;
  };
  export default src;
}
