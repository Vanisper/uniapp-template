export { }

declare module "vue" {
  type Hooks = App.AppInstance & Page.PageInstance
  interface ComponentCustomOptions extends Hooks {}
}

declare global {
  type Nullable<T> = T | null
}
