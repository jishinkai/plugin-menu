import { Ctx, MilkdownPlugin } from '@milkdown/ctx';
import { CmdKey } from '@milkdown/core';
import * as _milkdown_utils from '@milkdown/utils';

type CommandPayload = unknown;
type ButtonConfig<T = unknown> = {
    type: 'button';
    content: string | HTMLElement;
    key: string | [string, CommandPayload] | [CmdKey<T>, T];
    active?: (ctx: Ctx) => boolean;
    disabled?: (ctx: Ctx) => boolean;
};
type SelectOptions = {
    id: string | number;
    content: string | HTMLElement;
};
type SelectConfig = {
    type: 'select';
    options: SelectOptions[];
    text: string;
    onSelect: (id: SelectOptions['id']) => [string, CommandPayload] | string;
    disabled?: (ctx: Ctx) => boolean;
};
type MenuConfigItem = SelectConfig | ButtonConfig;
declare const button: (config: ButtonConfig, ctx: Ctx) => HTMLButtonElement[];
declare const divider: () => HTMLDivElement[];
declare const select: (config: SelectConfig, ctx: Ctx) => (HTMLButtonElement | HTMLUListElement)[];

type MenuPluginConfig = {
    items?: MenuConfigItem[][];
    attributes?: Record<string, string>;
};
declare const menuDomCtx: _milkdown_utils.$Ctx<{}, "menuDom">;
declare const menuConfigCtx: _milkdown_utils.$Ctx<Required<MenuPluginConfig>, "menuConfig">;
declare const menuView: _milkdown_utils.$Prose;

declare const defaultConfigItems: MenuConfigItem[][];
declare const defaultConfig: Required<MenuPluginConfig>;
declare const menuDefaultConfig: (ctx: Ctx) => void;

declare const menu: MilkdownPlugin[];

export { type ButtonConfig, type MenuConfigItem, type MenuPluginConfig, type SelectConfig, type SelectOptions, button, defaultConfig, defaultConfigItems, divider, menu, menuConfigCtx, menuDefaultConfig, menuDomCtx, menuView, select };
