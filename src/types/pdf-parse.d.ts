// @types/pdf-parse types the package root ("pdf-parse"); we import the
// implementation file directly (to skip its debug-mode disk read), so point
// that path at the same types.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdf from "pdf-parse";
  export default pdf;
}
