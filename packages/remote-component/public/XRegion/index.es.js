import { createElementBlock as i, openBlock as c, createElementVNode as o, toDisplayString as a, renderSlot as n } from "vue";
const d = (e, t) => {
  const s = e.__vccOpts || e;
  for (const [_, r] of t)
    s[_] = r;
  return s;
}, l = { class: "ef-region" }, f = { class: "ef-region__header" }, p = { class: "ef-region__title" }, g = { class: "ef-region__tools" }, u = { class: "ef-region__body" }, h = {
  __name: "XRegion",
  props: {
    title: String
  },
  setup(e) {
    return (t, s) => (c(), i("div", l, [
      o("div", f, [
        o("span", p, a(e.title), 1),
        o("div", g, [
          n(t.$slots, "tools", {}, void 0, !0)
        ])
      ]),
      o("div", u, [
        n(t.$slots, "default", {}, void 0, !0)
      ])
    ]));
  }
}, m = /* @__PURE__ */ d(h, [["__scopeId", "data-v-269aad2c"]]);
export {
  m as default
};
