// src/menu-plugin.ts
import { rootDOMCtx } from "@milkdown/core";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import { $ctx, $prose } from "@milkdown/utils";

// src/menu-item.ts
import { commandsCtx, editorViewCtx } from "@milkdown/core";
var button = (config, ctx) => {
  const $button = document.createElement("button");
  $button.role = "menuitem";
  $button.setAttribute("type", "button");
  if (config.content instanceof HTMLElement) {
    $button.appendChild(config.content);
  } else {
    $button.innerText = config.content;
  }
  $button.addEventListener("click", () => {
    if (typeof config.key === "string")
      ctx.get(commandsCtx).call(config.key);
    else
      ctx.get(commandsCtx).call(config.key[0], config.key[1]);
  });
  return [$button];
};
var divider = () => {
  const $divider = document.createElement("div");
  $divider.role = "separator";
  return [$divider];
};
var select = (config, ctx) => {
  const $button = document.createElement("button");
  $button.role = "menuitem";
  $button.setAttribute("type", "button");
  $button.setAttribute("aria-haspopup", "true");
  $button.setAttribute("aria-expanded", "false");
  $button.setAttribute("tab-index", "0");
  $button.textContent = config.text;
  const $buttonExpand = document.createElement("span");
  $buttonExpand.innerHTML = `<svg style="vertical-align: middle;" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m12 15.375l-6-6l1.4-1.4l4.6 4.6l4.6-4.6l1.4 1.4l-6 6Z"/></svg>`;
  $button.append($buttonExpand);
  const $select = document.createElement("ul");
  $select.role = "menu";
  $select.setAttribute("aria-label", config.text);
  $select.setAttribute("tabindex", "-1");
  $select.append(
    ...config.options.map((item) => {
      const listItem = document.createElement("li");
      listItem.role = "menuitem";
      listItem.setAttribute("tabindex", "-1");
      if (item.content instanceof HTMLElement) {
        listItem.append(item.content);
      } else {
        listItem.textContent = item.content;
      }
      listItem.addEventListener("click", () => {
        const command = config.onSelect(item.id);
        if (typeof command === "string") {
          ctx.get(commandsCtx).call(command);
        } else {
          ctx.get(commandsCtx).call(command[0], command[1]);
        }
        $button.setAttribute("aria-expanded", "false");
        $select.classList.remove("show");
        $select.blur();
      });
      return listItem;
    })
  );
  $button.addEventListener("click", () => {
    const expanded = ($button.getAttribute("aria-expanded") ?? "false") === "false" ? false : true;
    $button.setAttribute("aria-expanded", !expanded ? "true" : "false");
    if (!expanded) {
      $select.classList.add("show");
      ctx.get(editorViewCtx).dom.addEventListener("click", onClickOutside);
    } else {
      $select.classList.remove("show");
      $select.blur();
      ctx.get(editorViewCtx).dom.removeEventListener("click", onClickOutside);
    }
    function onClickOutside() {
      $button.setAttribute("aria-expanded", "false");
      $select.classList.remove("show");
      $select.blur();
    }
  });
  return [$button, $select];
};

// src/menu-plugin.ts
var menuDomCtx = $ctx({}, "menuDom");
var menuConfigCtx = $ctx(
  { items: [], attributes: { class: "milkdown-menu" } },
  "menuConfig"
);
var key = new PluginKey("MILKDOWN_PLUGIN_MENU");
var createContainer = (ctx) => {
  const config = ctx.get(menuConfigCtx.key);
  const container = document.createElement("div");
  Object.entries(config.attributes).forEach(([key2, val]) => {
    if (key2 === "class")
      container.classList.add(val);
    else
      container.setAttribute(key2, val);
  });
  return container;
};
var createMenuBar = (ctx) => {
  const menubar = document.createElement("ul");
  menubar.role = "menubar";
  menubar.setAttribute("aria-label", "Editor menubar");
  const config = ctx.get(menuConfigCtx.key);
  const itemsWithDivider = config.items.reduce(
    (acc, curr, index) => {
      if (index === config.items.length - 1)
        return acc.concat(...curr);
      return acc.concat(...curr).concat("divider");
    },
    []
  );
  const menuBarItems = itemsWithDivider.map((item) => {
    const listItem = document.createElement("li");
    listItem.role = "none";
    const createItem = () => {
      if (typeof item === "string")
        return divider();
      else if (item.type === "button")
        return button(item, ctx);
      else
        return select(item, ctx);
    };
    listItem.append(...createItem());
    return { $: listItem, config: item };
  });
  menubar.append(...menuBarItems.map((item) => item.$));
  return { dom: menubar, items: menuBarItems };
};
var menuView = $prose((ctx) => {
  const prosePlugin = new Plugin({
    key,
    view: (editorView) => {
      const root = ctx.get(rootDOMCtx);
      const container = createContainer(ctx);
      ctx.set(menuDomCtx.key, container);
      const editor = editorView.dom;
      root.insertBefore(container, editor);
      const menubar = createMenuBar(ctx);
      if (menubar.dom.children.length !== 0) {
        container.append(menubar.dom);
      }
      return {
        update: () => {
          menubar.items.forEach((item) => {
            if (typeof item.config !== "string") {
              if (item.config.type === "button" && item.config.active) {
                const isActive = item.config.active(ctx);
                if (isActive) {
                  item.$.querySelector("button")?.classList.add("active");
                } else {
                  item.$.querySelector("button")?.classList.remove("active");
                }
              }
              if (typeof item.config.disabled != "undefined") {
                const isDisabled = item.config.disabled(ctx);
                if (isDisabled) {
                  item.$.style.display = "none";
                } else {
                  item.$.style.display = "unset";
                }
              }
            }
          });
        },
        destroy: () => {
          container?.remove();
        }
      };
    }
  });
  return prosePlugin;
});

// src/default-config.ts
import { editorStateCtx, prosePluginsCtx, schemaCtx } from "@milkdown/core";
var createIconContent = (icon) => {
  const span = document.createElement("span");
  span.className = "material-icons material-icons-outlined";
  span.textContent = icon;
  return span;
};
var hasMark = (state, type) => {
  if (!type)
    return false;
  const { from, $from, to, empty } = state.selection;
  if (empty)
    return !!type.isInSet(state.storedMarks || $from.marks());
  return state.doc.rangeHasMark(from, to, type);
};
var getUndoDepth = (ctx) => {
  const historyKey = ctx.get(prosePluginsCtx).find(
    //@ts-expect-error: inner property
    (i) => i.key === "history$"
  );
  const state = ctx.get(editorStateCtx);
  const hist = historyKey?.getState(state);
  return hist ? hist.done.eventCount : 0;
};
var getRedoDepth = (ctx) => {
  const historyKey = ctx.get(prosePluginsCtx).find(
    //@ts-expect-error: inner property
    (i) => i.key === "history$"
  );
  const state = ctx.get(editorStateCtx);
  const hist = historyKey?.getState(state);
  return hist ? hist.undone.eventCount : 0;
};
var defaultConfigItems = [
  [
    {
      type: "button",
      content: createIconContent("turn_left"),
      key: "Undo",
      disabled: (ctx) => {
        try {
          if (!!ctx.get("historyProviderConfig")) {
            const undoDepth = getUndoDepth(ctx);
            return undoDepth <= 0;
          }
        } catch (error) {
          return true;
        }
        return true;
      }
    },
    {
      type: "button",
      content: createIconContent("turn_right"),
      key: "Redo",
      disabled: (ctx) => {
        try {
          if (!!ctx.get("historyProviderConfig")) {
            const redoDepth = getRedoDepth(ctx);
            return redoDepth <= 0;
          }
        } catch (error) {
          return true;
        }
        return true;
      }
    }
  ],
  [
    {
      type: "select",
      text: "Heading",
      options: [
        { id: 1, content: "Large Heading" },
        { id: 2, content: "Medium Heading" },
        { id: 3, content: "Small Heading" },
        { id: 0, content: "Plain Text" }
      ],
      onSelect: (id) => !!id ? ["WrapInHeading", id] : "TurnIntoText"
    }
  ],
  [
    {
      type: "button",
      content: createIconContent("format_bold"),
      key: "ToggleStrong",
      active: (ctx) => {
        const state = ctx.get(editorStateCtx);
        const schema = ctx.get(schemaCtx);
        return hasMark(state, schema.marks.strong);
      }
    },
    {
      type: "button",
      content: createIconContent("format_italic"),
      key: "ToggleEmphasis",
      active: (ctx) => {
        const state = ctx.get(editorStateCtx);
        const schema = ctx.get(schemaCtx);
        return hasMark(state, schema.marks.emphasis);
      }
    },
    {
      type: "button",
      content: createIconContent("strikethrough_s"),
      key: "ToggleStrikeThrough",
      active: (ctx) => {
        const state = ctx.get(editorStateCtx);
        const schema = ctx.get(schemaCtx);
        return hasMark(state, schema.marks.strike_through);
      }
    }
  ],
  [
    {
      type: "button",
      content: createIconContent("format_list_bulleted"),
      key: "WrapInBulletList"
    },
    {
      type: "button",
      content: createIconContent("format_list_numbered"),
      key: "WrapInOrderedList"
    },
    // Notice: didn't provider any more in preset-gfm after v7
    // {
    //   type: 'button',
    //   content: createIconContent('checklist'),
    //   key: 'TurnIntoTaskList',
    // },
    {
      type: "button",
      content: createIconContent("format_indent_decrease"),
      key: "SplitListItem"
    },
    {
      type: "button",
      content: createIconContent("format_indent_increase"),
      key: "SinkListItem"
    }
  ],
  [
    // Notice: this two command work properly, but maybe need improve UX
    // {
    //   type: 'button',
    //   content: createIconContent('link'),
    //   key: ['ToggleLink', { href: '' }],
    // },
    //
    // {
    //   type: 'button',
    //   content: createIconContent('image'),
    //   key: 'InsertImage',
    // },
    {
      type: "button",
      content: createIconContent("table_chart"),
      key: "InsertTable"
    },
    {
      type: "button",
      content: createIconContent("code"),
      key: "CreateCodeBlock"
    }
  ],
  [
    {
      type: "button",
      content: createIconContent("format_quote"),
      key: "WrapInBlockquote"
    },
    {
      type: "button",
      content: createIconContent("horizontal_rule"),
      key: "InsertHr"
    }
    // TODO:provide command by this package?
    // {
    //   type: 'button',
    //   content: createIconContent('select_all'),
    //   key: 'SelectParent',
    // },
  ]
];
var defaultConfig = {
  items: defaultConfigItems,
  attributes: { class: "milkdown-menu" }
};
var menuDefaultConfig = (ctx) => {
  ctx.set(menuConfigCtx.key, defaultConfig);
};

// src/index.ts
var menu = [menuDomCtx, menuConfigCtx, menuView];
export {
  button,
  defaultConfig,
  defaultConfigItems,
  divider,
  menu,
  menuConfigCtx,
  menuDefaultConfig,
  menuDomCtx,
  menuView,
  select
};
