declare module "base-64" {
  export function decode(input: string): string;
  export function encode(input: string): string;
}

declare var global: any;
declare function atob(data: string): string;
declare function btoa(data: string): string;
