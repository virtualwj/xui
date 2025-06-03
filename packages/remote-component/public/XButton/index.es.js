import { createElementBlock as s, openBlock as c, normalizeClass as l, renderSlot as a } from "vue";
const p = (t, e) => {
  const o = t.__vccOpts || t;
  for (const [n, r] of e)
    o[n] = r;
  return o;
}, f = {
  props: {
    type: String
  }
};
function i(t, e, o, n, r, u) {
  return c(), s("button", {
    class: l(["ef-button", o.type]),
    onClick: e[0] || (e[0] = (d) => t.$emit("click"))
  }, [
    a(t.$slots, "default")
  ], 2);
}
const _ = /* @__PURE__ */ p(f, [["render", i]]);
export {
  _ as default
};
