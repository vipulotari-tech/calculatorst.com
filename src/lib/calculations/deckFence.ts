import { toFeet, wasteFactor, ceilDiscrete } from "../../utils/units";

export function deckBoards(opts: {
  deckLength: number; lengthUnit: string;
  deckWidth: number; widthUnit: string;
  boardWidth: number; boardWidthUnit: string;
  boardLength: number; boardLengthUnit: string;
  gap: number; gapUnit: string;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.deckLength, opts.lengthUnit);
  const Wf = toFeet(opts.deckWidth, opts.widthUnit);
  const bw = toFeet(opts.boardWidth, opts.boardWidthUnit);
  const bl = toFeet(opts.boardLength, opts.boardLengthUnit);
  const gap = toFeet(opts.gap, opts.gapUnit);
  const area = Lf * Wf;
  const effWidth = bw + gap;
  const rows = effWidth >0 ? Math.ceil(Wf / effWidth) : 0;
  const boardsPerRow = bl >0 ? Math.ceil(Lf / bl) : 0;
  const boards = rows * boardsPerRow;
  const linearFt = boards * bl;
  const w = wasteFactor(opts.wastePercent);
  return { area, rows, boardsPerRow, boards, boardsW: ceilDiscrete(boards * w), linearFt, linearFtW: linearFt*w, wasteF: w };
}

export function deckJoists(opts: {
  deckLength: number; lengthUnit: string;
  joistSpacingIn: number; // 12,16,24
  wastePercent?: number;
}) {
  const Lf = toFeet(opts.deckLength, opts.lengthUnit);
  const spacingFt = opts.joistSpacingIn / 12;
  const count = Math.ceil(Lf / spacingFt) + 1;
  const w = wasteFactor(opts.wastePercent ?? 0);
  return { Lf, spacingFt, count, countW: ceilDiscrete(count * w), wasteF: w };
}

export function fencePosts(opts: {
  length: number; lengthUnit: string;
  postSpacing: number; spacingUnit: string; // 8 ft typical
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Sf = toFeet(opts.postSpacing, opts.spacingUnit);
  const posts = Sf >0 ? Math.ceil(Lf / Sf) + 1 : 0;
  const w = wasteFactor(opts.wastePercent);
  return { Lf, Sf, posts, postsW: ceilDiscrete(posts * w), wasteF: w };
}

export function fencePickets(opts: {
  length: number; lengthUnit: string;
  picketWidth: number; picketWidthUnit: string;
  gap: number; gapUnit: string;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const pw = toFeet(opts.picketWidth, opts.picketWidthUnit);
  const gap = toFeet(opts.gap, opts.gapUnit);
  const eff = pw + gap;
  const inches = Lf * 12;
  const effIn = eff *12;
  const pickets = effIn>0 ? Math.ceil(inches / effIn) : 0;
  const w = wasteFactor(opts.wastePercent);
  return { Lf, pw, gap, eff, pickets, picketsW: ceilDiscrete(pickets * w), wasteF: w };
}

export function fenceConcretePerPost(opts: {
  postCountW: number;
  bagsPerPost?: number; // 0.5 bag 50lb per post typical
}) {
  const bags = opts.postCountW * (opts.bagsPerPost ?? 0.5);
  return { bags: Math.ceil(bags) };
}
