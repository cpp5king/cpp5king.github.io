// 最小 DOM 測試替身：只模擬本機欄位元件所需的樹及事件，不啟動瀏覽器。
class Element {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.value = ''; this.checked = false; this.hidden = false; this.events = {}; }
  append(...nodes) { for (const node of nodes) { node.parentElement = this; this.children.push(node); } }
  addEventListener(name, callback) { (this.events[name] ||= []).push(callback); }
  dispatch(name, event = {}) { for (const callback of this.events[name] || []) callback(event); if (this.parentElement) this.parentElement.dispatch(name, event); }
  setAttribute(key, value) { this[key] = value; }
  replaceChildren(...items) { this.children = []; this.append(...items); }
  set textContent(value) { this._text = value; this.children = []; }
  get textContent() { return (this._text || '') + this.children.map(n => n.textContent || '').join(''); }
  querySelectorAll(selector) { return nodes(this).slice(1).filter(n => selector === '[role="status"]' ? n.role === 'status' : n.tagName === selector.toUpperCase()); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() { this.focused = true; }
  get options() { return this.children.filter(child => child.tagName === 'OPTION'); }
}
function documentStub() { return { createElement: tag => new Element(tag), createTextNode: text => ({ textContent: text, children: [] }) }; }
function nodes(root) { return [root, ...root.children.flatMap(nodes)]; }
module.exports = { documentStub, nodes };
