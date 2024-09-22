import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { UniswapV3DemoContextProvider } from "../context/UniswapV3DemoContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UniswapV3DemoContextProvider>
      <Component {...pageProps} />
    </UniswapV3DemoContextProvider>
  );
}
