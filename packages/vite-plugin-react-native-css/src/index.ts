import { transform } from "lightningcss";
import { dataToEsm } from "@rollup/pluginutils";
import { compile } from "react-native-css/compiler";

import { type Plugin } from "vite";

const fileRegex = /\.(s?rncss|rnsass)$/;

export function reactNativeCSS(): Plugin[] {
  return [
    {
      name: "vite-plugin-react-native-css",
      transform(src, id) {
        if (fileRegex.test(id)) {
          const nativeStyles = compile(Buffer.from(src), {
            filename: id,
          }).stylesheet();
          const { code: webStyles } = transform({
            filename: id,
            code: Buffer.from(src),
          });

          const platformStyles = {
            web: webStyles.toString(),
            native: nativeStyles,
          };

          const modulesCode = dataToEsm(platformStyles, {
            namedExports: true,
            preferConst: true,
          });

          return {
            code: modulesCode,
            map: null,
            moduleSideEffects: true,
          };
        }
      },
    },
  ];
}
