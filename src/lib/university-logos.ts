// Official logos of the campuses, by campus slug (files in public/universities,
// see the CREDITS.md there). A campus without one shows its initials instead.
const LOGOS: Record<string, string> = {
  rupp: "/universities/rupp.png",
  itc: "/universities/itc.png",
  num: "/universities/num.png",
  aupp: "/universities/aupp.png",
  cadt: "/universities/cadt.png",
  ifl: "/universities/ifl.png",
  cmu: "/universities/cmu.png",
  norton: "/universities/norton.png",
  puc: "/universities/puc.png",
  rufa: "/universities/rufa.png",
  uhs: "/universities/uhs.png",
  beltei: "/universities/beltei.png",
  cus: "/universities/cus.png",
  iu: "/universities/iu.png",
  npic: "/universities/npic.png",
  paragon: "/universities/paragon.png",
  ppiu: "/universities/ppiu.png",
  psbu: "/universities/psbu.png",
  rua: "/universities/rua.png",
  rule: "/universities/rule.png",
  setec: "/universities/setec.png",
  up: "/universities/up.png",
  western: "/universities/western.png",
};

export function universityLogo(slug: string): string | null {
  return LOGOS[slug] ?? null;
}
