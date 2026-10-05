import type PusherClient from "pusher-js";
import * as reactNativeBuild from "pusher-js/react-native";

export type PusherInstance = PusherClient;
type PusherConstructor = typeof PusherClient;
type BuildExports = { Pusher?: unknown; default?: unknown };

export function resolvePusher(build: BuildExports): PusherConstructor {
  const candidate = typeof build.Pusher === "function" ? build.Pusher : build.default;
  if (typeof candidate !== "function") throw new Error("pusher-js did not export a Pusher class");
  return candidate as PusherConstructor;
}

export const Pusher = resolvePusher(reactNativeBuild as BuildExports);
