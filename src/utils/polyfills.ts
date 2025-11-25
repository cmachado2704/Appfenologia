import { decode as atob, encode as btoa } from "base-64";

if (typeof global.atob === "undefined") {
  global.atob = atob;
}

if (typeof global.btoa === "undefined") {
  global.btoa = btoa;
}
