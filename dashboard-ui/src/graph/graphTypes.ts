import * as d3 from "d3";

export type BaseSel = d3.Selection<d3.BaseType, unknown, null, undefined>;

export type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;
export type GSelection = BaseSel;
export type NodeSelection = BaseSel;
export type EdgeSelection = BaseSel;

export type ZoomBehavior = d3.ZoomBehavior<Element, unknown>;
export type Transform = d3.ZoomTransform;
